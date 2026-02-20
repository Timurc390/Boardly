from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0017_board_permissions_and_roles'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='activity_retention',
            field=models.CharField(
                choices=[('7d', '7 days'), ('30d', '1 month'), ('365d', '1 year')],
                default='30d',
                max_length=10,
                verbose_name='Activity retention period',
            ),
        ),
    ]
