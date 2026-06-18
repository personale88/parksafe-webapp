// Enums
export { IssueType } from './enums/issueType'
export { ChannelType } from './enums/channelType'

// Schemas + inferred types
export {
  RequestOtpSchema,
  VerifyOtpSchema,
  type RequestOtpInput,
  type VerifyOtpInput,
} from './schemas/auth.schema'

export {
  VehicleSchema,
  CreateVehicleSchema,
  UpdateVehicleSchema,
  type Vehicle,
  type CreateVehicleInput,
  type UpdateVehicleInput,
} from './schemas/vehicle.schema'

export {
  TagStatusSchema,
  TagInfoSchema,
  UpdateTagSchema,
  type TagStatus,
  type TagInfo,
  type UpdateTagInput,
} from './schemas/tag.schema'

export {
  ContactRequestSchema,
  ContactResponseSchema,
  type ContactRequest,
  type ContactResponse,
} from './schemas/contact.schema'

export {
  RelayRequestSchema,
  RelayResponseSchema,
  type RelayRequest,
  type RelayResponse,
} from './schemas/relay.schema'

export {
  VehicleTypeSchema,
  RegisterVehicleSchema,
  RegisterVehicleFormSchema,
  type VehicleType,
  type RegisterVehicleInput,
  type RegisterVehicleFormInput,
} from './schemas/registration.schema'

export {
  DashboardSummarySchema,
  RewardSchema,
  AlertVehicleSchema,
  ContactEventSummarySchema,
  type AlertVehicle,
  type DashboardSummary,
  type Reward,
  type ContactEventSummary,
} from './schemas/dashboard.schema'

export {
  MaskedVehicleSummarySchema,
  ReportedVehicleEventSchema,
  ReportsReceivedResponseSchema,
  ReportsSentResponseSchema,
  type MaskedVehicleSummary,
  type ReportedVehicleEvent,
  type ReportsReceivedResponse,
  type ReportsSentResponse,
} from './schemas/reports.schema'

export {
  UserProfileSchema,
  UpdateProfileSchema,
  UserSettingsSchema,
  UpdateSettingsSchema,
  type UserProfile,
  type UpdateProfileInput,
  type UserSettings,
  type UpdateSettingsInput,
} from './schemas/profile.schema'

export {
  TagBatchStatusSchema,
  CreateTagBatchSchema,
  TagBatchSummarySchema,
  CreateTagBatchResponseSchema,
  TagBatchListResponseSchema,
  TagBatchSampleSchema,
  TagBatchSamplesResponseSchema,
  AdminAuthCheckResponseSchema,
  MAX_TAG_BATCH_SIZE,
  type TagBatchStatus,
  type CreateTagBatchInput,
  type TagBatchSummary,
  type CreateTagBatchResponse,
  type TagBatchListResponse,
  type TagBatchSample,
  type TagBatchSamplesResponse,
  type AdminAuthCheckResponse,
  TagInventorySummarySchema,
  TagBatchInventoryRowSchema,
  TagInventoryResponseSchema,
  type TagInventorySummary,
  type TagBatchInventoryRow,
  type TagInventoryResponse,
} from './schemas/admin.schema'

// Message templates
export { MESSAGE_TEMPLATES } from './messageTemplates'

export type { AnalyticsFlow, ServerAnalyticsEvent } from './analytics'
