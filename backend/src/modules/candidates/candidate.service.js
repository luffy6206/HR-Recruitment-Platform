import Candidate from "./candidate.model.js";
import CandidateProfile from "../profiles/candidateProfile.model.js";
import CandidateTimeline from "../timelines/candidateTimeline.model.js";
import CandidateAudit from "../audits/candidateAudit.model.js";

import { generateCandidateCode } from "../../shared/services/candidateCode.service.js";
import { createTimelineEvent } from "../../shared/services/timeline.service.js";
import { createAuditLog } from "../../shared/services/audit.service.js";

import { TIMELINE_EVENTS } from "../../constants/timelineEvents.js";

import { getPagination } from "../../shared/utils/pagination.js";

import AppError from "../../shared/errors/AppError.js";

const resolveCandidateType = (passingYear) => {
  if (typeof passingYear !== "number") {
    return null;
  }

  const currentYear = new Date().getFullYear();
  return passingYear <= currentYear ? "PASSOUT" : "STUDENT";
};

export const findDuplicateCandidate = async ({ email, phone }) => {
  const conditions = [];
  if (email) {
    conditions.push({ email });
  }
  if (phone) {
    conditions.push({ phone });
  }

  if (conditions.length === 0) {
    return null;
  }

  return Candidate.findOne({
    $or: conditions,
    isDeleted: false,
  });
};

export const createCandidate = async (
  payload,
  userId
) => {
  console.log('[CANDIDATE] createCandidate called');
  // Candidate Validation & Sanitization Layer
  const name = payload.name ?? payload.fullName ?? "Unknown Candidate";
  const email = payload.email ? String(payload.email).toLowerCase().trim() : "";
  const phone = payload.phone ? String(payload.phone).trim() : "";
  const category = payload.category ?? "General";
  const status = payload.status ?? payload.currentStatus ?? "NEW";
  const assignedHR = payload.assignedHR ?? null; // Extract assignedHR from payload

  const duplicateConditions = [];

  if (email) {
    duplicateConditions.push({
      email: email,
    });
  }

  if (phone) {
    duplicateConditions.push({
      phone: phone,
    });
  }

  // Allow bypassing duplicate checks for test runs by setting SKIP_DUPLICATE_CHECK=true
  if (duplicateConditions.length && process.env.SKIP_DUPLICATE_CHECK !== 'true') {
    const existingCandidate = await findDuplicateCandidate({
      email: email || undefined,
      phone: phone || undefined,
    });

    if (existingCandidate) {
      console.log("[DUPLICATE BLOCKED]", existingCandidate._id.toString());
      throw new AppError(
        "Candidate already exists",
        409
      );
    }
  }

  const candidateCode =
    await generateCandidateCode();

  let finalCandidateCode = candidateCode;
  if (!finalCandidateCode) {
    finalCandidateCode = `CAN-${new Date().getFullYear()}-TMP-${Date.now()}`;
  }

  console.log('[CANDIDATE] Generated candidateCode:', finalCandidateCode);
  console.log('[CANDIDATE] Creating candidate payload', {
    name,
    email: email || undefined,
    phone: phone || undefined,
    category,
    status,
    assignedHR: assignedHR || undefined,
    code: finalCandidateCode,
    candidateCode: finalCandidateCode,
  });

  const candidate =
    await Candidate.create({
      ...payload,
      name,
      email: email || undefined,
      phone: phone || undefined,
      category,
      status,
      assignedHR: assignedHR || undefined,
      code: finalCandidateCode,
      candidateCode: finalCandidateCode,
      uploadInfo: {
        uploadedBy: userId,
        uploadedAt: new Date(),
      },
    });

  await CandidateProfile.create({
    candidateId: candidate._id,
  });

  await createTimelineEvent({
    candidateId: candidate._id,

    eventType:
      TIMELINE_EVENTS.RESUME_UPLOADED,

    title: "Candidate Created",

    description:
      "Candidate record created",

    performedBy: userId,
  });

  // Create additional timeline event for HR assignment if assignedHR is provided
  if (assignedHR) {
    await createTimelineEvent({
      candidateId: candidate._id,

      eventType: "HR_ASSIGNED",

      title: "HR Assigned During Upload",

      description: `Candidate assigned to HR during resume upload`,

      performedBy: userId,
    });
  }

  return candidate;
};

export const getCandidates = async (
  query,
  user
) => {
  const {
    page,
    limit,
    search,
    status,
    assignedHR,
  } = query;

  const { skip, pageSize } =
    getPagination(page, limit);

  const filter = {
    isDeleted: false,
  };

  // Role-based filtering: if user is HR, only show candidates assigned to them
  if (user && user.role === "HR") {
    filter.assignedHR = user.id;
  } else if (assignedHR) {
    // If user is ADMIN and specifies an assignedHR filter, apply it
    filter.assignedHR = assignedHR;
  }

  if (search) {
    filter.$or = [
      {
        name: {
          $regex: search,
          $options: "i",
        },
      },
      {
        email: {
          $regex: search,
          $options: "i",
        },
      },
      {
        phone: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  if (status) {
    filter.status = status;
  }

  const candidates =
    await Candidate.find(filter)
      .populate(
        "assignedHR",
        "name email"
      )
      .skip(skip)
      .limit(pageSize)
      .sort({
        createdAt: -1,
      });

  const candidateIds = candidates.map((candidate) => candidate._id);
  const profiles = await CandidateProfile.find(
    {
      candidateId: { $in: candidateIds },
    },
    {
      candidateId: 1,
      candidateType: 1,
    }
  );

  const profileMap = new Map(
    profiles.map((profile) => [String(profile.candidateId), profile.candidateType])
  );

  const enrichedCandidates = candidates.map((candidate) => {
    const candidateCopy = candidate.toObject ? candidate.toObject() : { ...candidate };
    candidateCopy.candidateType = profileMap.get(String(candidate._id));
    return candidateCopy;
  });

  const total =
    await Candidate.countDocuments(
      filter
    );

  return {
    total,
    page: Number(page) || 1,
    limit: pageSize,
    candidates: enrichedCandidates,
  };
};

export const getCandidateById = async (
  id
) => {
  const candidate =
    await Candidate.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate("assignedHR", "name email role");

  if (!candidate) {
    throw new AppError(
      "Candidate not found",
      404
    );
  }

  const [
    profile,
    timeline,
    audits,
  ] = await Promise.all([
    CandidateProfile.findOne({
      candidateId: id,
    }),

    CandidateTimeline.find({
      candidateId: id,
    }).sort({
      createdAt: -1,
    }),

    CandidateAudit.find({
      candidateId: id,
    }).sort({
      changedAt: -1,
    }),
  ]);

  return {
    candidate,

    profile: profile || null,

    timeline,

    audits,
  };
};

export const updateCandidate = async (
  id,
  payload,
  userId,
  userRole
) => {
  const candidate =
    await Candidate.findOne({
      _id: id,
      isDeleted: false,
    });

  if (!candidate) {
    throw new AppError(
      "Candidate not found",
      404
    );
  }

  const currentAssignedHR =
    candidate.assignedHR &&
    (candidate.assignedHR._id ?? candidate.assignedHR);

  if (
    userRole === "HR" &&
    String(currentAssignedHR) !== userId
  ) {
    throw new AppError(
      "Not authorized to update this candidate",
      403
    );
  }

  const allowedFields = [
    "name",
    "email",
    "phone",
    "category",
    "assignedHR",
    "status",
    "currentLocation",
    "permanentLocation",
    "technicalTraining",
    "passingYear",
    "candidateType",
    "academicYear",
    "cgpa",
  ];

  const updates = {};

  for (const field of allowedFields) {
    let payloadField = field;
    if (field === "name" && !Object.prototype.hasOwnProperty.call(payload, "name") && Object.prototype.hasOwnProperty.call(payload, "fullName")) {
      payloadField = "fullName";
    }
    if (field === "status" && !Object.prototype.hasOwnProperty.call(payload, "status") && Object.prototype.hasOwnProperty.call(payload, "currentStatus")) {
      payloadField = "currentStatus";
    }

    if (Object.prototype.hasOwnProperty.call(payload, payloadField)) {
      updates[field] = payload[payloadField];
    }
  }

  if (updates.email) {
    updates.email = updates.email.toLowerCase().trim();
  }

  if (userRole === "HR" && Object.prototype.hasOwnProperty.call(updates, "assignedHR")) {
    const updatedAssignedHR = String(updates.assignedHR);
    if (updatedAssignedHR !== String(currentAssignedHR)) {
      throw new AppError(
        "HR users cannot reassign candidates",
        403
      );
    }
  }

  const changedFields = [];

  for (const field of [
    "name",
    "email",
    "phone",
    "category",
    "assignedHR",
    "status",
    "currentAddress",
    "permanentAddress",
    "technicalTraining",
    "passingYear",
    "candidateType",
    "academicYear",
    "cgpa",
  ]) {
    if (!Object.prototype.hasOwnProperty.call(updates, field)) {
      continue;
    }

    const oldValue = candidate[field];
    const newValue = updates[field];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      await createAuditLog({
        candidateId: candidate._id,
        fieldName: field,
        oldValue,
        newValue,
        changedBy: userId,
      });
      changedFields.push(field);
    }
  }

  Object.assign(candidate, updates);

  let profile = await CandidateProfile.findOne({ candidateId: id });
  let profileChangedFields = [];
  if (!profile && [
    "currentLocation",
    "permanentLocation",
    "technicalTraining",
    "passingYear",
  ].some((field) => Object.prototype.hasOwnProperty.call(updates, field))) {
    profile = await CandidateProfile.create({ candidateId: id });
  }

  if (profile) {
    const profileFields = [
      "currentLocation",
      "permanentLocation",
      "technicalTraining",
      "passingYear",
      "candidateType",
      "academicYear",
      "cgpa",
    ];

    for (const field of profileFields) {
      if (!Object.prototype.hasOwnProperty.call(updates, field)) {
        continue;
      }

      const oldValue = profile[field];
      const newValue = updates[field];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        profile[field] = newValue;
        await createAuditLog({
          candidateId: candidate._id,
          fieldName: `profile.${field}`,
          oldValue,
          newValue,
          changedBy: userId,
        });
        profileChangedFields.push(field);
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, "passingYear") &&
      !Object.prototype.hasOwnProperty.call(updates, "candidateType")
    ) {
      const computedType = resolveCandidateType(updates.passingYear);
      if (computedType && profile.candidateType !== computedType) {
        await createAuditLog({
          candidateId: candidate._id,
          fieldName: "profile.candidateType",
          oldValue: profile.candidateType,
          newValue: computedType,
          changedBy: userId,
          reason: "Candidate type computed from passing year",
        });
        profile.candidateType = computedType;
        profileChangedFields.push("candidateType");
      }
    }

    if (profileChangedFields.length > 0) {
      await profile.save();
    }
  }

  await candidate.save();

  if (changedFields.length > 0 || profileChangedFields.length > 0) {
    const description = [
      ...changedFields,
      ...profileChangedFields,
    ]
      .map((field) => {
        if (field === "passingYear") return "Passing year updated";
        if (field === "candidateType") return "Candidate type updated";
        if (field === "academicYear") return "Academic year updated";
        if (field === "cgpa") return "CGPA updated";
        if (field === "technicalTraining") return "Technical training details updated";
        if (field === "currentLocation") return "Current location updated";
        if (field === "permanentLocation") return "Permanent location updated";
        return `${field} updated`;
      })
      .join(", ");

    await createTimelineEvent({
      candidateId: candidate._id,
      eventType: TIMELINE_EVENTS.PROFILE_UPDATED,
      title: "Candidate Profile Updated",
      description,
      performedBy: userId,
    });
  }

  return candidate;
};

export const softDeleteCandidate =
  async (
    id,
    userId
  ) => {
    const candidate =
      await Candidate.findOne({
        _id: id,
        isDeleted: false,
      });

    if (!candidate) {
      throw new AppError(
        "Candidate not found",
        404
      );
    }

    candidate.isDeleted = true;

    candidate.deletedAt =
      new Date();

    candidate.deletedBy =
      userId;

    await candidate.save();

    await createTimelineEvent({
      candidateId:
        candidate._id,

      eventType:
        TIMELINE_EVENTS.DROPPED,

      title:
        "Candidate Deleted",

      description:
        "Candidate soft deleted",

      performedBy: userId,
    });

    return candidate;
  };