from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0018_profile_activity_retention'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='theme',
            field=models.CharField(
                choices=[('light', 'Світла'), ('dark', 'Темна')],
                default='dark',
                max_length=50,
                verbose_name='Тема інтерфейсу',
            ),
        ),
    ]
