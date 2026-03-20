import logging

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Registration, Trip
from .serializers import (
    PaymentRequestSerializer,
    RegistrationDetailSerializer,
    RegistrationSerializer,
    TransactionSerializer,
    TripSerializer,
)
from .services import PaymentService

logger = logging.getLogger('payments')


class TripListView(generics.ListAPIView):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer


class TripDetailView(generics.RetrieveAPIView):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer


class RegistrationCreateView(generics.CreateAPIView):
    serializer_class = RegistrationSerializer


class RegistrationDetailView(generics.RetrieveAPIView):
    queryset = Registration.objects.select_related('trip')
    serializer_class = RegistrationDetailSerializer


class PaymentView(APIView):
    def post(self, request):
        serializer = PaymentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        registration = serializer.validated_data['registration']
        card_details = serializer.validated_data['card_details']

        service = PaymentService()
        transaction, success = service.process_payment(registration, card_details)

        if success:
            registration.refresh_from_db()
            return Response({
                'success': True,
                'transaction': TransactionSerializer(transaction).data,
                'registration': RegistrationDetailSerializer(registration).data,
            })
        else:
            return Response({
                'success': False,
                'error': transaction.error_message or 'Payment declined by processor. Please try again.',
                'registration_id': str(registration.id),
            }, status=status.HTTP_402_PAYMENT_REQUIRED)
