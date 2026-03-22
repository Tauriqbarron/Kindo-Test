from django.urls import path

from . import views

urlpatterns = [
    path('auth/signup/', views.SignupView.as_view(), name='signup'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/me/', views.MeView.as_view(), name='me'),
    path('children/', views.ChildListCreateView.as_view(), name='child-list'),
    path('children/<uuid:pk>/', views.ChildDetailView.as_view(), name='child-detail'),
]
