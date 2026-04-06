export enum College {
  HUMANITIES = '인문대학',
  SOCIAL_SCIENCES = '사회과학대학',
  NATURAL_SCIENCES = '자연과학대학',
  ECONOMICS_BUSINESS = '경상대학',
  ENGINEERING = '공과대학',
  IT_ENGINEERING = 'IT대학',
  AGRICULTURE_LIFE_SCIENCES = '농업생명과학대학',
  MUSIC_ARTS = '예술대학',
  TEACHERS_COLLEGE = '사범대학',
  MEDICINE = '의과대학',
  DENTISTRY = '치과대학',
  VETERINARY_MEDICINE = '수의과대학',
  HUMAN_ECOLOGY = '생활과학대학',
  NURSING = '간호대학',
  PHARMACY = '약학대학',
  PUBLIC_ADMINISTRATION = '행정학부',
  UNDECLARED_MAJORS = '자율전공부',
  ECOLOGY_ENVIRONMENTAL = '생태환경대학',
  SCIENCE_TECHNOLOGY = '과학기술대학',
  ADVANCED_TECHNOLOGY_CONVERGENCE = '첨단기술융합대학',
  FUTURE_INNOVATORS = '자율미래인재학부',
}

/**
 * 영어 정식 명칭 매핑 (참고용)
 */
export const CollegeEnglishNames: Record<College, string> = {
  [College.HUMANITIES]: 'College of Humanities',
  [College.SOCIAL_SCIENCES]: 'College of Social Sciences',
  [College.NATURAL_SCIENCES]: 'College of Natural Sciences',
  [College.ECONOMICS_BUSINESS]:
    'College of Economics and Business Administration',
  [College.ENGINEERING]: 'College of Engineering',
  [College.IT_ENGINEERING]: 'College of IT Engineering',
  [College.AGRICULTURE_LIFE_SCIENCES]:
    'College of Agriculture and Life Sciences',
  [College.MUSIC_ARTS]: 'College of Music and Visual Arts',
  [College.TEACHERS_COLLEGE]: 'Teachers College',
  [College.MEDICINE]: 'College of Medicine',
  [College.DENTISTRY]: 'College of Dentistry',
  [College.VETERINARY_MEDICINE]: 'College of Veterinary Medicine',
  [College.HUMAN_ECOLOGY]: 'College of Human Ecology',
  [College.NURSING]: 'College of Nursing',
  [College.PHARMACY]: 'College of Pharmacy',
  [College.PUBLIC_ADMINISTRATION]: 'School of Public Administration',
  [College.UNDECLARED_MAJORS]: 'School of Undeclared Majors',
  [College.ECOLOGY_ENVIRONMENTAL]:
    'College of Ecology and Environmental Science',
  [College.SCIENCE_TECHNOLOGY]: 'College of Science and Technology',
  [College.ADVANCED_TECHNOLOGY_CONVERGENCE]:
    'College of Advanced Technology Convergence',
  [College.FUTURE_INNOVATORS]: 'School of Future Innovators',
};
