import logging

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AccountCredit, Registration, Trip
from .serializers import (
    AccountCreditSerializer,
    DashboardRegistrationSerializer,
    PaymentRequestSerializer,
    RegistrationDetailSerializer,
    RegistrationSerializer,
    TransactionSerializer,
    TripSerializer,
    WithdrawalSerializer,
    WithdrawRequestSerializer,
)
from .services import PaymentService
from .withdrawal_service import WithdrawalService

logger = logging.getLogger('payments')


class TripListView(generics.ListAPIView):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer


class TripDetailView(generics.RetrieveAPIView):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer


class RegistrationCreateView(generics.CreateAPIView):
    serializer_class = RegistrationSerializer


class DashboardView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DashboardRegistrationSerializer

    def get_queryset(self):
        return Registration.objects.filter(
            parent=self.request.user,
        ).select_related('trip', 'child', 'transaction', 'withdrawal')


class RegistrationDetailView(generics.RetrieveAPIView):
    queryset = Registration.objects.select_related('trip')
    serializer_class = RegistrationDetailSerializer


class PaymentView(APIView):
    def post(self, request):
        serializer = PaymentRequestSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        registration = serializer.validated_data['registration']
        card_details = serializer.validated_data['card_details']
        use_credit = serializer.validated_data.get('use_credit', False)

        service = PaymentService()
        user = request.user if request.user.is_authenticated else None
        transaction, success = service.process_payment(
            registration, card_details,
            use_credit=use_credit, user=user,
        )

        if success:
            registration.refresh_from_db()
            response_data = {
                'success': True,
                'transaction': TransactionSerializer(transaction).data,
                'registration': RegistrationDetailSerializer(registration).data,
            }
            if user:
                response_data['credit_balance'] = str(
                    AccountCredit.balance_for_user(user),
                )
            return Response(response_data)
        else:
            return Response({
                'success': False,
                'error': transaction.error_message or 'Payment declined by processor. Please try again.',
                'registration_id': str(registration.id),
            }, status=status.HTTP_402_PAYMENT_REQUIRED)


class WithdrawView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            registration = Registration.objects.select_related(
                'trip', 'transaction',
            ).get(id=pk, parent=request.user)
        except Registration.DoesNotExist:
            return Response(
                {'error': 'Registration not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if registration.status != 'confirmed':
            return Response(
                {'error': 'Only confirmed registrations can be withdrawn.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if hasattr(registration, 'withdrawal'):
            return Response(
                {'error': 'This registration has already been withdrawn.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = WithdrawRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        resolution = serializer.validated_data['resolution']
        service = WithdrawalService()
        withdrawal, success = service.process_withdrawal(
            registration, resolution, request.user,
        )

        if success:
            return Response({
                'success': True,
                'withdrawal': WithdrawalSerializer(withdrawal).data,
                'credit_balance': str(AccountCredit.balance_for_user(request.user)),
            })
        else:
            return Response({
                'success': False,
                'error': 'Refund processing failed. Please try again.',
            }, status=status.HTTP_400_BAD_REQUEST)


class CancelRegistrationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            registration = Registration.objects.get(
                id=pk, parent=request.user,
            )
        except Registration.DoesNotExist:
            return Response(
                {'error': 'Registration not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if registration.status != 'pending':
            return Response(
                {'error': 'Only pending registrations can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        registration.status = 'cancelled'
        registration.save(update_fields=['status', 'updated_at'])

        return Response({'success': True})


class CreditBalanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        balance = AccountCredit.balance_for_user(request.user)
        return Response({'balance': str(balance)})


class CreditListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AccountCreditSerializer

    def get_queryset(self):
        return AccountCredit.objects.filter(user=self.request.user)
