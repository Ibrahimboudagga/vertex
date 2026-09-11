import {type SchemaTypeDefinition} from 'sanity'

import {agentContext} from './agentContext'
import {category} from './category'
import {course} from './course'
import {instructor} from './instructor'
import {lesson} from './lesson'
import {video} from './video'
import {courseModule} from './objects/courseModule'
import {learningOutcome} from './objects/learningOutcome'
import {resource} from './objects/resource'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [category, instructor, lesson, course, video, agentContext, courseModule, learningOutcome, resource],
}
