import 'server-only'

import {vertexSanityFetch} from './fetch'
import {
  ALL_CATEGORIES_QUERY,
  ALL_COURSE_SLUGS_QUERY,
  ALL_COURSES_QUERY,
  ALL_INSTRUCTOR_SLUGS_QUERY,
  ALL_LESSON_SLUGS_QUERY,
  COURSE_BY_SLUG_QUERY,
  INSTRUCTOR_BY_SLUG_QUERY,
  LESSON_BY_SLUG_QUERY,
} from './queries'
import type {
  CategoryListItem,
  Course,
  CourseListItem,
  CourseSlug,
  Instructor,
  InstructorSlug,
  Lesson,
  LessonSlug,
} from './types'

export function getAllCourses() {
  return vertexSanityFetch<typeof ALL_COURSES_QUERY, CourseListItem[]>({
    query: ALL_COURSES_QUERY,
    tags: ['course', 'instructor', 'category'],
  })
}

export function getCourseBySlug(slug: string) {
  return vertexSanityFetch<typeof COURSE_BY_SLUG_QUERY, Course | null>({
    query: COURSE_BY_SLUG_QUERY,
    params: {slug},
    tags: [`course:${slug}`, 'course', 'lesson', 'instructor', 'category'],
  })
}

export function getAllCourseSlugs() {
  return vertexSanityFetch<typeof ALL_COURSE_SLUGS_QUERY, CourseSlug[]>({
    query: ALL_COURSE_SLUGS_QUERY,
    revalidate: 3600,
  })
}

export function getLessonBySlug(slug: string) {
  return vertexSanityFetch<typeof LESSON_BY_SLUG_QUERY, Lesson | null>({
    query: LESSON_BY_SLUG_QUERY,
    params: {slug},
    tags: [`lesson:${slug}`, 'lesson', 'course', 'instructor', 'category'],
  })
}

export function getAllLessonSlugs() {
  return vertexSanityFetch<typeof ALL_LESSON_SLUGS_QUERY, LessonSlug[]>({
    query: ALL_LESSON_SLUGS_QUERY,
    revalidate: 3600,
  })
}

export function getInstructorBySlug(slug: string) {
  return vertexSanityFetch<typeof INSTRUCTOR_BY_SLUG_QUERY, Instructor | null>({
    query: INSTRUCTOR_BY_SLUG_QUERY,
    params: {slug},
    tags: [`instructor:${slug}`, 'instructor', 'course'],
  })
}

export function getAllInstructorSlugs() {
  return vertexSanityFetch<typeof ALL_INSTRUCTOR_SLUGS_QUERY, InstructorSlug[]>({
    query: ALL_INSTRUCTOR_SLUGS_QUERY,
    revalidate: 3600,
  })
}

export function getAllCategories() {
  return vertexSanityFetch<typeof ALL_CATEGORIES_QUERY, CategoryListItem[]>({
    query: ALL_CATEGORIES_QUERY,
    tags: ['category', 'course'],
  })
}
