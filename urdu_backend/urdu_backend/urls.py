from django.contrib import admin
from django.urls import path
from translator import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/translate/', views.translate_text),
    path('api/translate-audio/', views.translate_audio),
]