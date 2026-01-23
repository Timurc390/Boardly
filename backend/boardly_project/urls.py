from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Маршрути аутентифікації Djoser (реєстрація, логін, токени)
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.authtoken')),
    
    # Підключаємо наші API маршрути з додатку core
    # Зверни увагу: ми посилаємось на core.api.urls
    path('api/', include('core.api.urls')),
]

# Роздача медіа-файлів у режимі розробки
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)