import {LinkIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const resource = defineType({
  name: 'resource',
  title: 'Resource',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'type',
      type: 'string',
      options: {
        list: [
          {title: 'Article', value: 'article'},
          {title: 'Download', value: 'download'},
          {title: 'Repository', value: 'repository'},
          {title: 'Tool', value: 'tool'},
          {title: 'Reference', value: 'reference'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(240),
    }),
    defineField({
      name: 'url',
      type: 'url',
      validation: (rule) =>
        rule.required().uri({
          scheme: ['http', 'https'],
        }),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'type',
    },
  },
})
