export enum Role {
  CITIZEN = 'CITIZEN',
  ADOPTER = 'ADOPTER',
  FEEDER = 'FEEDER',
  VOLUNTEER = 'VOLUNTEER',
  VET = 'VET',
  OFFICER = 'OFFICER',
  NGO = 'NGO',
  ADMIN = 'ADMIN',
}

export enum AnimalType {
  DOG = 'DOG',
  CAT = 'CAT',
}

export enum AnimalSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNKNOWN = 'UNKNOWN',
}

export enum AnimalStatus {
  STRAY = 'STRAY',
  AWAITING_NEUTER = 'AWAITING_NEUTER',
  ADOPTABLE = 'ADOPTABLE',
  IN_PROCESS = 'IN_PROCESS',
  ADOPTED = 'ADOPTED',
  FOSTERING = 'FOSTERING',
  DECEASED = 'DECEASED',
}

export enum ReportType {
  NEW_SIGHTING = 'NEW_SIGHTING',
  INJURED = 'INJURED',
  AGGRESSIVE = 'AGGRESSIVE',
  GROWING_PACK = 'GROWING_PACK',
  ABUSE = 'ABUSE',
}

export enum ReportStatus {
  RECEIVED = 'RECEIVED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}
