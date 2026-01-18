from django.urls import path, include

from users.views.AuthView import LoginInitiateView, OTPVerifyView, ResendOTPView, SendPasswordResetLinkView, \
    PasswordResetView, LoginView, UpdatePassword

urlpatterns = [

    # Auth
    path('login/', LoginInitiateView.as_view(), name='initiate-login'),
    path('verify-otp/', OTPVerifyView.as_view(), name='verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    path('send-password-reset/', SendPasswordResetLinkView.as_view(), name='send-password-reset-link'),
    path('password-reset/', PasswordResetView.as_view(), name='password-reset'),
    path('express/login/', LoginView.as_view(), name='express-login'),
    path('password/update/', UpdatePassword.as_view(), name='password-update'),

]
