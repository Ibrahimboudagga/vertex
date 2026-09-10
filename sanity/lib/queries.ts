import {defineQuery} from 'next-sanity'

const IMAGE_FIELDS = `
  asset,
  hotspot,
  crop,
  alt
`

const INSTRUCTOR_CARD_FIELDS = `
  _id,
  name,
  "slug": slug.current,
  expertise,
  photo{${IMAGE_FIELDS}}
`

const CATEGORY_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  description
`

const LESSON_CARD_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  duration,
  freePreview,
  studentCount,
  thumbnail{${IMAGE_FIELDS}},
  keyPoints
`

const MODULE_FIELDS = `
  _key,
  title,
  summary,
  lessons[]->{
    ${LESSON_CARD_FIELDS}
  }
`

export const ALL_COURSES_QUERY = defineQuery(`
  *[_type == "course" && defined(slug.current)]
  | order(isPopular desc, title asc) {
    _id,
    title,
    "slug": slug.current,
    summary,
    coverImage{${IMAGE_FIELDS}},
    level,
    price,
    isPopular,
    studentCount,
    instructor->{${INSTRUCTOR_CARD_FIELDS}},
    category->{${CATEGORY_FIELDS}},
    "moduleCount": count(modules),
    "lessonCount": count(modules[].lessons[]),
    "durationSeconds": math::sum(modules[].lessons[]->duration)
  }
`)

export const COURSE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "course" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    summary,
    coverImage{${IMAGE_FIELDS}},
    level,
    price,
    isPopular,
    studentCount,
    outcomes[]{
      _key,
      icon,
      title,
      description
    },
    instructor->{${INSTRUCTOR_CARD_FIELDS}, bio},
    category->{${CATEGORY_FIELDS}},
    modules[]{${MODULE_FIELDS}}
  }
`)

export const ALL_COURSE_SLUGS_QUERY = defineQuery(`
  *[_type == "course" && defined(slug.current)] {
    "slug": slug.current
  }
`)

export const LESSON_BY_SLUG_QUERY = defineQuery(`
  *[_type == "lesson" && slug.current == $slug][0] {
    ${LESSON_CARD_FIELDS},
    videoUrl,
    notes,
    proTip,
    resources[]{
      _key,
      type,
      title,
      description,
      url
    },
    "courseContext": *[
      _type == "course" &&
      references(^._id)
    ][0] {
      _id,
      title,
      "slug": slug.current,
      coverImage{${IMAGE_FIELDS}},
      level,
      studentCount,
      instructor->{${INSTRUCTOR_CARD_FIELDS}},
      category->{${CATEGORY_FIELDS}},
      modules[]{
        _key,
        title,
        summary,
        lessons[]->{
          ${LESSON_CARD_FIELDS}
        }
      }
    }
  }
`)

export const ALL_LESSON_SLUGS_QUERY = defineQuery(`
  *[_type == "lesson" && defined(slug.current)] {
    "slug": slug.current
  }
`)

export const INSTRUCTOR_BY_SLUG_QUERY = defineQuery(`
  *[_type == "instructor" && slug.current == $slug][0] {
    ${INSTRUCTOR_CARD_FIELDS},
    bio,
    "courses": *[_type == "course" && references(^._id)]
      | order(title asc) {
        _id,
        title,
        "slug": slug.current,
        summary,
        coverImage{${IMAGE_FIELDS}},
        level,
        price,
        isPopular,
        studentCount
      }
  }
`)

export const ALL_INSTRUCTOR_SLUGS_QUERY = defineQuery(`
  *[_type == "instructor" && defined(slug.current)] {
    "slug": slug.current
  }
`)

export const ALL_CATEGORIES_QUERY = defineQuery(`
  *[_type == "category" && defined(slug.current)]
  | order(title asc) {
    ${CATEGORY_FIELDS},
    "courseCount": count(*[_type == "course" && references(^._id)])
  }
`)
