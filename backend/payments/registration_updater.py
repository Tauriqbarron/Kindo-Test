"""
RegistrationUpdater — updates Registration.status based on payment outcome (SRP).
"""


class RegistrationUpdater:
    def update(self, registration, success):
        registration.status = 'confirmed' if success else 'failed'
        registration.save(update_fields=['status', 'updated_at'])
