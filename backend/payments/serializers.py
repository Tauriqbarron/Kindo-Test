from rest_framework import serializers

from accounts.models import Child
from .card_details import CardDetails, CardValidationError
from .models import AccountCredit, Registration, Transaction, Trip, Withdrawal


class TripSerializer(serializers.ModelSerializer):
    spots_remaining = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    registration_open = serializers.BooleanField(read_only=True)
    registered_children = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            'id', 'title', 'description', 'destination', 'date', 'cost',
            'school_id', 'activity_id', 'capacity', 'spots_remaining', 'is_full',
            'registered_children', 'registration_close_date', 'payment_due_date',
            'registration_open',
        ]

    def get_registered_children(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return []
        registrations = obj.registrations.filter(
            parent=request.user,
            status__in=['pending', 'registered', 'confirmed'],
        ).select_related('child')
        return [
            {
                'registration_id': str(reg.id),
                'name': reg.child.name if reg.child else reg.student_name,
                'status': reg.status,
            }
            for reg in registrations
        ]


class RegistrationSerializer(serializers.ModelSerializer):
    child_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Registration
        fields = [
            'id', 'trip', 'student_name', 'parent_name', 'parent_email',
            'parent_phone', 'status', 'created_at', 'child_id',
        ]
        read_only_fields = ['id', 'status', 'created_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['student_name'].required = False
            self.fields['parent_name'].required = False
            self.fields['parent_email'].required = False

    def validate_trip(self, value):
        if value.is_full:
            raise serializers.ValidationError('This trip is full.')
        if not value.registration_open:
            raise serializers.ValidationError('Registration for this trip has closed.')
        return value

    def validate_child_id(self, value):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError('Authentication required to use child_id.')
        try:
            child = Child.objects.get(id=value, parent=request.user)
        except Child.DoesNotExist:
            raise serializers.ValidationError('Child not found.')
        return value

    def create(self, validated_data):
        child_id = validated_data.pop('child_id', None)
        request = self.context.get('request')

        if child_id and request and request.user.is_authenticated:
            child = Child.objects.get(id=child_id, parent=request.user)
            user = request.user
            validated_data['parent'] = user
            validated_data['child'] = child
            validated_data.setdefault('student_name', child.name)
            validated_data.setdefault(
                'parent_name',
                f"{user.first_name} {user.last_name}".strip(),
            )
            validated_data.setdefault('parent_email', user.email)

        return super().create(validated_data)


class RegistrationDetailSerializer(serializers.ModelSerializer):
    trip = TripSerializer(read_only=True)

    class Meta:
        model = Registration
        fields = [
            'id', 'trip', 'student_name', 'parent_name', 'parent_email',
            'parent_phone', 'status', 'created_at',
        ]


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'id', 'amount', 'status', 'transaction_ref',
            'card_last_four', 'processed_at', 'created_at',
        ]


class DashboardTripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = ['id', 'title', 'destination', 'date', 'cost', 'payment_due_date']


class DashboardRegistrationSerializer(serializers.ModelSerializer):
    trip = DashboardTripSerializer(read_only=True)
    child_name = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    can_withdraw = serializers.SerializerMethodField()
    can_cancel = serializers.SerializerMethodField()
    can_pay = serializers.SerializerMethodField()
    amount_owing = serializers.SerializerMethodField()
    withdrawal_status = serializers.SerializerMethodField()

    class Meta:
        model = Registration
        fields = [
            'id', 'trip', 'student_name', 'child_name', 'status',
            'payment_status', 'created_at', 'can_withdraw', 'can_cancel',
            'can_pay', 'amount_owing', 'withdrawal_status',
        ]

    def get_child_name(self, obj):
        if obj.child:
            return obj.child.name
        return obj.student_name

    def get_payment_status(self, obj):
        if obj.status == 'registered':
            return 'owing'
        transaction = getattr(obj, 'transaction', None)
        if transaction:
            return transaction.status
        return None

    def get_can_withdraw(self, obj):
        return obj.status == 'confirmed' and not hasattr(obj, 'withdrawal')

    def get_can_cancel(self, obj):
        return obj.status in ['pending', 'registered']

    def get_can_pay(self, obj):
        return obj.status == 'registered'

    def get_amount_owing(self, obj):
        if obj.status == 'registered':
            return str(obj.trip.cost)
        return None

    def get_withdrawal_status(self, obj):
        withdrawal = getattr(obj, 'withdrawal', None)
        if withdrawal:
            return withdrawal.status
        return None


class PaymentRequestSerializer(serializers.Serializer):
    registration_id = serializers.UUIDField()
    card_number = serializers.CharField(max_length=19, required=False, default='')
    expiry_date = serializers.CharField(max_length=5, required=False, default='')
    cvv = serializers.CharField(max_length=4, required=False, default='')
    use_credit = serializers.BooleanField(default=False, required=False)

    def validate(self, data):
        try:
            registration = Registration.objects.select_related('trip').get(
                id=data['registration_id'],
            )
        except Registration.DoesNotExist:
            raise serializers.ValidationError(
                {'registration_id': 'Registration not found.'},
            )

        if registration.status == 'confirmed':
            raise serializers.ValidationError(
                {'registration_id': 'Payment already completed for this registration.'},
            )

        data['registration'] = registration

        # Check if credit covers the full amount
        credit_covers_full = False
        if data.get('use_credit'):
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                from .models import AccountCredit
                balance = AccountCredit.balance_for_user(request.user)
                credit_covers_full = balance >= registration.trip.cost

        # Only validate card if credit doesn't cover the full amount
        if not credit_covers_full:
            if not data.get('card_number') or not data.get('expiry_date') or not data.get('cvv'):
                raise serializers.ValidationError(
                    {'card': 'Card details are required when credit does not cover the full amount.'},
                )
            try:
                card = CardDetails(
                    card_number=data['card_number'],
                    expiry_date=data['expiry_date'],
                    cvv=data['cvv'],
                )
                data['card_details'] = card
            except CardValidationError as e:
                raise serializers.ValidationError({'card': e.message})
        else:
            data['card_details'] = None

        return data


class WithdrawRequestSerializer(serializers.Serializer):
    resolution = serializers.ChoiceField(choices=['credit', 'refund'])


class WithdrawalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Withdrawal
        fields = [
            'id', 'registration', 'amount', 'resolution', 'status',
            'processed_at', 'created_at',
        ]


class AccountCreditSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountCredit
        fields = ['id', 'amount', 'reason', 'registration', 'note', 'created_at']
