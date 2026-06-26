# Data Model — ระบบจัดการสัตว์จรจัด

## Summary
- **Entities**: 18 core entities
- **Database**: PostgreSQL 16 + PostGIS extension
- **ORM**: Prisma with custom PostGIS types
- **Key patterns**: Soft delete, audit trail, UUID primary keys, timestamps on all entities

## Entity Relationship Diagram

```
User ──┬── Report (1:N)
       ├── Volunteer (1:1)
       ├── Adopter (1:1)
       └── FeedingStation (1:N)

Animal ──┬── AnimalPhoto (1:N)
         ├── AnimalHistory (1:N)
         ├── MedicalRecord (1:N)
         ├── AdoptionProfile (1:1)
         ├── FosterPeriod (1:N)
         └── Donation (1:N)

Report ──── CaseAssignment (1:1)

Campaign ── CampaignResult (1:N)

Zone ──── ZoneAssignment (1:N)

Adopter ──┬── ScreeningResult (1:1)
          └── AdoptionApplication (1:N) ── FollowUp (1:N)
```

## Core Entities

### User
```prisma
model User {
  id            String   @id @default(uuid())
  email         String?  @unique
  phone         String?  @unique
  lineUserId    String?  @unique
  passwordHash  String?
  displayName   String
  role          Role     @default(CITIZEN)
  district      String?
  isActive      Boolean  @default(true)
  consentGiven  Boolean  @default(false)
  consentDate   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?
}

enum Role {
  CITIZEN
  ADOPTER
  FEEDER
  VOLUNTEER
  VET
  OFFICER
  NGO
  ADMIN
}
```

### Animal
```prisma
model Animal {
  id            String       @id @default(uuid())
  animalId      String       @unique  // ANM-YYYYMMDD-XXXX
  type          AnimalType
  name          String?
  color         String
  size          AnimalSize
  gender        Gender
  personality   String?
  markings      String?
  estimatedAge  String?
  neutered      Boolean      @default(false)
  neuteredDate  DateTime?
  earTipped     Boolean      @default(false)
  vaccinated    Boolean      @default(false)
  status        AnimalStatus @default(STRAY)
  location      Unsupported("geometry(Point, 4326)")
  district      String
  registeredBy  String       // User.id
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  deletedAt     DateTime?
}

enum AnimalType { DOG, CAT }
enum AnimalSize { SMALL, MEDIUM, LARGE }
enum Gender { MALE, FEMALE, UNKNOWN }
enum AnimalStatus {
  STRAY
  AWAITING_NEUTER
  ADOPTABLE
  IN_PROCESS
  ADOPTED
  FOSTERING
  DECEASED
}
```

### Report
```prisma
model Report {
  id            String       @id @default(uuid())
  trackingId    String       @unique  // RPT-YYYYMMDD-XXXX
  type          ReportType
  description   String
  location      Unsupported("geometry(Point, 4326)")
  district      String
  urgent        Boolean      @default(false)
  anonymous     Boolean      @default(false)
  status        ReportStatus @default(RECEIVED)
  reporterId    String?      // null if anonymous
  animalId      String?      // linked animal if identified
  photoUrls     String[]
  slaDeadline   DateTime
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

enum ReportType {
  NEW_SIGHTING
  INJURED
  AGGRESSIVE
  GROWING_PACK
  ABUSE
}
enum ReportStatus {
  RECEIVED
  ASSIGNED
  IN_PROGRESS
  RESOLVED
  ESCALATED
}
```

### MedicalRecord
```prisma
model MedicalRecord {
  id            String          @id @default(uuid())
  animalId      String
  type          MedicalType
  date          DateTime
  vetId         String          // User.id (VET role)
  description   String
  medications   String?
  notes         String?
  photoUrls     String[]
  offlineSync   Boolean         @default(false)
  syncedAt      DateTime?
  createdAt     DateTime        @default(now())
}

enum MedicalType {
  VACCINATION
  STERILIZATION
  TREATMENT
  CHECKUP
  EMERGENCY
}
```

### Campaign
```prisma
model Campaign {
  id            String         @id @default(uuid())
  name          String
  district      String
  targetCount   Int
  actualCount   Int            @default(0)
  budget        Decimal
  budgetUsed    Decimal        @default(0)
  startDate     DateTime
  endDate       DateTime
  status        CampaignStatus @default(PLANNED)
  teamId        String
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

enum CampaignStatus { PLANNED, ACTIVE, COMPLETED, CANCELLED }
```

### Adoption Entities
```prisma
model Adopter {
  id              String   @id @default(uuid())
  userId          String   @unique
  housingType     String
  hasYard         Boolean
  experience      String
  timeAvailable   String
  householdMembers Int
  existingPets    String?
  screeningStatus ScreeningStatus @default(PENDING)
  createdAt       DateTime @default(now())
}

enum ScreeningStatus { PENDING, PASSED, FAILED }

model AdoptionApplication {
  id            String            @id @default(uuid())
  adopterId     String
  animalId      String
  status        AdoptionStatus    @default(INTERESTED)
  meetingDate   DateTime?
  trialStartDate DateTime?
  trialEndDate  DateTime?
  confirmedDate DateTime?
  returnReason  String?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
}

enum AdoptionStatus {
  INTERESTED
  MEETING_SCHEDULED
  TRIAL
  CONFIRMED
  RETURNED
  CANCELLED
}

model FollowUp {
  id              String        @id @default(uuid())
  applicationId   String
  scheduledDate   DateTime
  completedDate   DateTime?
  status          FollowUpStatus @default(PENDING)
  photoUrls       String[]
  notes           String?
}

enum FollowUpStatus { PENDING, COMPLETED, OVERDUE, MISSED }
```

### Community Entities
```prisma
model FeedingStation {
  id            String   @id @default(uuid())
  feederId      String   // User.id
  location      Unsupported("geometry(Point, 4326)")
  district      String
  feedingTime   String
  animalCount   Int
  photoUrl      String?
  isActive      Boolean  @default(true)
  lastCheckIn   DateTime?
  createdAt     DateTime @default(now())
}

model Volunteer {
  id            String   @id @default(uuid())
  userId        String   @unique
  skills        String[] // driving, catching, firstaid, foster
  district      String
  availability  String
  totalHours    Decimal  @default(0)
  badgeLevel    BadgeLevel @default(NONE)
  createdAt     DateTime @default(now())
}

enum BadgeLevel { NONE, STARTER, ACTIVE, HERO }

model Donation {
  id            String       @id @default(uuid())
  donorId       String?      // null if anonymous
  animalId      String?      // null if general donation
  amount        Decimal
  type          DonationType
  status        String       @default("completed")
  createdAt     DateTime     @default(now())
}

enum DonationType { MONEY, GOODS, SPONSOR }
```

### Zone & Task
```prisma
model Zone {
  id            String   @id @default(uuid())
  name          String
  district      String
  boundary      Unsupported("geometry(Polygon, 4326)")
  teamId        String
  createdAt     DateTime @default(now())
}

model Task {
  id            String     @id @default(uuid())
  title         String
  type          String
  assigneeId    String
  priority      Priority
  deadline      DateTime
  status        TaskStatus @default(OPEN)
  completedAt   DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

enum Priority { LOW, MEDIUM, HIGH, CRITICAL }
enum TaskStatus { OPEN, IN_PROGRESS, COMPLETED, OVERDUE }
```

## Indexes & Performance

```sql
-- Spatial indexes
CREATE INDEX idx_animal_location ON "Animal" USING GIST (location);
CREATE INDEX idx_report_location ON "Report" USING GIST (location);
CREATE INDEX idx_feeding_station_location ON "FeedingStation" USING GIST (location);
CREATE INDEX idx_zone_boundary ON "Zone" USING GIST (boundary);

-- Search indexes
CREATE INDEX idx_animal_district ON "Animal" (district);
CREATE INDEX idx_animal_status ON "Animal" (status);
CREATE INDEX idx_animal_type_status ON "Animal" (type, status);
CREATE INDEX idx_report_status ON "Report" (status);
CREATE INDEX idx_report_district ON "Report" (district);

-- Full text search
CREATE INDEX idx_animal_search ON "Animal" USING GIN (
  to_tsvector('simple', coalesce(name,'') || ' ' || color || ' ' || coalesce(personality,''))
);
```
