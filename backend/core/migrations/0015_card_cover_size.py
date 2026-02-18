from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_profile_default_board_view_profile_notify_added_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='card',
            name='cover_size',
            field=models.CharField(blank=True, default='full', max_length=10, verbose_name='Розмір обкладинки'),
        ),
    ]
