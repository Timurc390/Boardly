from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0015_card_cover_size'),
    ]

    operations = [
        migrations.AddField(
            model_name='list',
            name='color',
            field=models.CharField(blank=True, max_length=20, null=True, verbose_name='Колір колонки'),
        ),
    ]
