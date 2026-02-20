from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0019_profile_theme_default_dark'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='password_initialized',
            field=models.BooleanField(default=True, verbose_name='Require current password on password change'),
        ),
    ]

