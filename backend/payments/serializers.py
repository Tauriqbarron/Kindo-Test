from rest_framework import serializers

from .card_details import CardDetails, CardValidationError
from .models import Registration, Transaction, Trip


class TripSerializer(serializers.ModelSerializer):
    spots_remaining = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)

    class Meta:
        model = Trip
        fields = [
            'id', 'title', 'description', 'destination', 'date', 'cost',
            'school_id', 'activity_id', 'capacity', 'spots_remaining', 'is_full',
        ]


class RegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Registration
        fields = [
            'id', 'trip', 'student_name', 'parent_name', 'parent_email',
            'parent_phone', 'status', 'created_at',
        ]
        read_only_fields = ['id', 'status', 'created_at']

    def validate_trip(self, value):
        if value.is_full:
            raise serializers.ValidationError('This trip is full.')
        return value


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


class PaymentRequestSerializer(serializers.Serializer):
    registration_id = serializers.UUIDField()
    card_number = serializers.CharField(max_length=19)
    expiry_date = serializers.CharField(max_length=5)
    cvv = serializers.CharField(max_length=4)

    def validate(self, data):
        try:
            card = CardDetails(
                card_number=data['card_number'],
                expiry_date=data['expiry_date'],
                cvv=data['cvv'],
            )
            data['card_details'] = card
        except CardValidationError as e:
            raise serializers.ValidationError({'card': e.message})

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
        return data
