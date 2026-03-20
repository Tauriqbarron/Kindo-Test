from django.urls import path

from . import views

urlpatterns = [
    path('trips/', views.TripListView.as_view(), name='trip-list'),
    path('trips/<uuid:pk>/', views.TripDetailView.as_view(), name='trip-detail'),
    path('registrations/', views.RegistrationCreateView.as_view(), name='registration-create'),
    path('registrations/<uuid:pk>/', views.RegistrationDetailView.as_view(), name='registration-detail'),
    path('payments/', views.PaymentView.as_view(), name='payment-create'),
]
