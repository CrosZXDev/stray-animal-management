/** Types for dashboard feature */

export interface DashboardStats {
  totalAnimals: number;
  totalDogs: number;
  totalCats: number;
  sterilizationRate: number;
  adoptionRate: number;
  reportResolutionRate: number;
  activeVolunteers: number;
  feedingStations: number;
}

export interface UrgentCase {
  id: string;
  trackingId: string;
  type: string;
  createdAt: string;
}

export interface OverdueVaccine {
  id: string;
  animalId: string;
  name: string;
  dueDate: string;
}

export interface PendingFollowup {
  id: string;
  adoptionId: string;
  scheduledDate: string;
}

export interface ActionItems {
  unassignedUrgentCases: UrgentCase[];
  overdueVaccines: OverdueVaccine[];
  pendingFollowups: PendingFollowup[];
}

export interface TrendPoint {
  month: string;
  count: number;
}

export interface DashboardTrends {
  monthlyRegistrations: TrendPoint[];
  monthlyAdoptions: TrendPoint[];
  monthlySterilizations: TrendPoint[];
}

export interface DashboardOverview {
  stats: DashboardStats;
  actionItems: ActionItems;
  trends: DashboardTrends;
}
