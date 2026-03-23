from django.urls import path

from . import views

urlpatterns = [
    path('trips/', views.TripListView.as_view(), name='trip-list'),
    path('trips/<uuid:pk>/', views.TripDetailView.as_view(), name='trip-detail'),
    path('registrations/', views.RegistrationCreateView.as_view(), name='registration-create'),
    path('registrations/<uuid:pk>/', views.RegistrationDetailView.as_view(), name='registration-detail'),
    path('registrations/<uuid:pk>/withdraw/', views.WithdrawView.as_view(), name='registration-withdraw'),
    path('registrations/<uuid:pk>/register-only/', views.RegisterOnlyView.as_view(), name='registration-register-only'),
    path('registrations/<uuid:pk>/cancel/', views.CancelRegistrationView.as_view(), name='registration-cancel'),
    path('payments/', views.PaymentView.as_view(), name='payment-create'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('credits/', views.CreditListView.as_view(), name='credit-list'),
    path('credits/balance/', views.CreditBalanceView.as_view(), name='credit-balance'),
]
