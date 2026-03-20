from django.contrib import admin

from .models import Registration, Transaction, Trip


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ('title', 'destination', 'date', 'cost', 'capacity', 'spots_remaining')
    search_fields = ('title', 'destination')


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ('student_name', 'parent_name', 'trip', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('student_name', 'parent_name')


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_ref', 'registration', 'amount', 'status', 'processed_at')
    list_filter = ('status',)
