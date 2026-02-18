from django.db import migrations, models


def forwards_roles(apps, schema_editor):
    Membership = apps.get_model('core', 'Membership')
    Membership.objects.filter(role='member').update(role='developer')


def backwards_roles(apps, schema_editor):
    Membership = apps.get_model('core', 'Membership')
    Membership.objects.filter(role='developer').update(role='member')


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0016_list_color'),
    ]

    operations = [
        migrations.AddField(
            model_name='board',
            name='dev_can_archive_assigned_cards',
            field=models.BooleanField(default=True, verbose_name='Dev може архівувати призначені картки'),
        ),
        migrations.AddField(
            model_name='board',
            name='dev_can_create_cards',
            field=models.BooleanField(default=True, verbose_name='Dev може створювати картки'),
        ),
        migrations.AddField(
            model_name='board',
            name='dev_can_create_lists',
            field=models.BooleanField(default=False, verbose_name='Dev може створювати списки'),
        ),
        migrations.AddField(
            model_name='board',
            name='dev_can_edit_assigned_cards',
            field=models.BooleanField(default=True, verbose_name='Dev може редагувати призначені картки'),
        ),
        migrations.AddField(
            model_name='board',
            name='dev_can_join_card',
            field=models.BooleanField(default=False, verbose_name='Dev може приєднуватися до чужих карток'),
        ),
        migrations.AddField(
            model_name='list',
            name='allow_dev_add_cards',
            field=models.BooleanField(default=True, verbose_name='Dev може додавати картки'),
        ),
        migrations.AlterField(
            model_name='membership',
            name='role',
            field=models.CharField(choices=[('admin', 'Адміністратор'), ('developer', 'Developer'), ('viewer', 'Viewer')], default='viewer', max_length=50, verbose_name='Роль'),
        ),
        migrations.RunPython(forwards_roles, backwards_roles),
    ]
