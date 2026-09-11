import {defineField, defineType} from 'sanity'

export const agentContext = defineType({
  name: 'sanity.agentContext',
  title: 'Agent context',
  type: 'document',
  fields: [
    defineField({name: 'slug', type: 'slug', options: {source: 'title'}, validation: (rule) => rule.required()}),
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'instructions', type: 'text', rows: 12, validation: (rule) => rule.required()}),
    defineField({name: 'groqFilter', title: 'Content filter', type: 'text', rows: 4, validation: (rule) => rule.required()}),
  ],
  preview: {select: {title: 'title', subtitle: 'slug.current'}},
})
