import {PlayIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const video = defineType({
  name: 'video',
  title: 'Video index',
  type: 'document',
  icon: PlayIcon,
  fields: [
    defineField({name: 'sourceId', title: 'Provider video ID', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'url', title: 'Video URL', type: 'url', validation: (rule) => rule.required().uri({scheme: ['http', 'https']})}),
    defineField({name: 'sourceTitle', title: 'Source title', type: 'string'}),
    defineField({
      name: 'chapters',
      title: 'Chapters',
      type: 'array',
      of: [defineArrayMember({
        type: 'object',
        fields: [
          defineField({name: 'startSeconds', type: 'number', validation: (rule) => rule.required().integer().min(0)}),
          defineField({name: 'label', type: 'string', validation: (rule) => rule.required()}),
        ],
        preview: {select: {title: 'label', seconds: 'startSeconds'}, prepare: ({title, seconds}) => ({title, subtitle: `${seconds ?? 0}s`})},
      })],
    }),
    defineField({
      name: 'chunks',
      title: 'Transcript chunks',
      type: 'array',
      of: [defineArrayMember({
        type: 'object',
        fields: [
          defineField({name: 'startSeconds', type: 'number', validation: (rule) => rule.required().integer().min(0)}),
          defineField({name: 'text', type: 'text', rows: 3, validation: (rule) => rule.required()}),
        ],
        preview: {select: {title: 'text', seconds: 'startSeconds'}, prepare: ({title, seconds}) => ({title, subtitle: `${seconds ?? 0}s`})},
      })],
    }),
  ],
  preview: {select: {title: 'sourceTitle', subtitle: 'url'}, prepare: ({title, subtitle}) => ({title: title || 'Untitled video', subtitle})},
})
