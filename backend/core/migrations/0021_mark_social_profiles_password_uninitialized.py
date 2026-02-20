from django.db import migrations


def mark_social_profiles_password_uninitialized(apps, schema_editor):
    Profile = apps.get_model('core', 'Profile')
    SocialAccount = apps.get_model('socialaccount', 'SocialAccount')

    social_user_ids = list(
        SocialAccount.objects.values_list('user_id', flat=True).distinct()
    )
    if not social_user_ids:
        return

    Profile.objects.filter(
        user_id__in=social_user_ids,
        password_initialized=True,
    ).update(password_initialized=False)


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0020_profile_password_initialized'),
        ('socialaccount', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(mark_social_profiles_password_uninitialized, migrations.RunPython.noop),
    ]

