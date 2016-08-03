# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('exp', '0013_merge'),
    ]

    operations = [
        migrations.AddField(
            model_name='study',
            name='recycle',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='study',
            name='unique_id',
            field=models.BooleanField(default=True),
        ),
    ]
