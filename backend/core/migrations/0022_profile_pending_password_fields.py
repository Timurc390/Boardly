from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0021_mark_social_profiles_password_uninitialized'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='pending_password_hash',
            field=models.CharField(
                max_length=255,
                blank=True,
                default='',
                verbose_name='Pending password hash',
            ),
        ),
        migrations.AddField(
            model_name='profile',
            name='pending_password_requested_at',
            field=models.DateTimeField(
                null=True,
                blank=True,
                verbose_name='Pending password requested at',
            ),
        ),
    ]
