from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Маршрути аутентифікації Djoser (реєстрація, логін, токени)
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.authtoken')),
    
    # Підключаємо наші API маршрути з додатку core
    # Зверни увагу: ми посилаємось на core.api.urls
    path('api/', include('core.api.urls')),
]

# Роздача медіа-файлів.
# Для Fly/production залишаємо явну роздачу через Django, щоб завантажені аватари
# були доступні за /media/... навіть коли DEBUG=False.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += [
    path('media/<path:path>', serve, {'document_root': settings.MEDIA_ROOT}),
]
