import {ComposeIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const learningOutcome = defineType({
  name: 'learningOutcome',
  title: 'Learning outcome',
  type: 'object',
  icon: ComposeIcon,
  fields: [
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'Semantic icon key used by the frontend.',
      options: {
        list: [
          {title: 'Code', value: 'code'},
          {title: 'Performance', value: 'performance'},
          {title: 'Architecture', value: 'architecture'},
          {title: 'Workflow', value: 'workflow'},
          {title: 'Search', value: 'search'},
        ],
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
      validation: (rule) => rule.required().max(240),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
    },
  },
})
