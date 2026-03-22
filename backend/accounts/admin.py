from django.contrib import admin

from .models import Child


@admin.register(Child)
class ChildAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'grade', 'created_at']
    list_filter = ['grade']
    search_fields = ['name', 'parent__email']
