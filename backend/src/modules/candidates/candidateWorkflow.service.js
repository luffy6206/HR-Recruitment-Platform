import Candidate from "./candidate.model.js";

import User from "../auth/auth.model.js";

import AppError from "../../shared/errors/AppError.js";

import { createAuditLog } from "../../shared/services/audit.service.js";

import { createTimelineEvent } from "../../shared/services/timeline.service.js";

import { createNotification } from "../notifications/notification.service.js";

import { TIMELINE_EVENTS } from "../../constants/timelineEvents.js";
import { CANDIDATE_STATUS } from "../../constants/candidateStatus.js";
import CandidateProfile from "../profiles/candidateProfile.model.js";

export const assignCandidate =
  async (
    candidateId,
    hrId,
    userId
  ) => {
    const candidate =
      await Candidate.findById(
        candidateId
      );

    if (!candidate) {
      throw new AppError(
        "Candidate not found",
        404
      );
    }

    const hr =
      await User.findById(hrId);

    if (!hr) {
      throw new AppError(
        "HR not found",
        404
      );
    }

    const oldHR =
      candidate.assignedHR;

    candidate.assignedHR =
      hrId;

    await candidate.save();

    await createAuditLog({
      candidateId,

      fieldName:
        "assignedHR",

      oldValue: oldHR,

      newValue: hrId,

      changedBy: userId,
    });

    await createTimelineEvent({
      candidateId,

      eventType:
        "CANDIDATE_ASSIGNED",

      title:
        "Candidate Assigned",

      description: `Assigned to ${hr.name}`,

      performedBy:
        userId,
    });

    await createNotification({
      userId: hrId,

      title:
        "Candidate Assigned",

      message:
        "A new candidate has been assigned to you",

      type:
        "ASSIGNMENT",
    });

    return candidate;
  };

  export const selectCandidate =
  async (
    candidateId,
    userId
  ) => {
    const candidate =
      await Candidate.findById(
        candidateId
      );

    if (!candidate) {
      throw new AppError(
        "Candidate not found",
        404
      );
    }

    const oldStatus =
      candidate.status;

    candidate.status =
      CANDIDATE_STATUS.SELECTED;

    await candidate.save();

    await createAuditLog({
      candidateId,

      fieldName:
        "status",

      oldValue:
        oldStatus,

      newValue:
        CANDIDATE_STATUS.SELECTED,

      changedBy:
        userId,
    });

    await createTimelineEvent({
      candidateId,

      eventType:
        "CANDIDATE_SELECTED",

      title:
        "Candidate Selected",

      description:
        "Candidate selected",

      performedBy:
        userId,
    });

    return candidate;
  };

  export const dropCandidate =
  async (
    candidateId,
    reason,
    userId
  ) => {
    const candidate =
      await Candidate.findById(
        candidateId
      );

    if (!candidate) {
      throw new AppError(
        "Candidate not found",
        404
      );
    }

    const oldStatus =
      candidate.status;

    candidate.status =
      CANDIDATE_STATUS.DROPPED;

    await candidate.save();

    await createAuditLog({
      candidateId,

      fieldName:
        "status",

      oldValue:
        oldStatus,

      newValue:
        CANDIDATE_STATUS.DROPPED,

      changedBy:
        userId,

      reason,
    });

    await createTimelineEvent({
      candidateId,

      eventType:
        "CANDIDATE_DROPPED",

      title:
        "Candidate Dropped",

      description:
        reason,

      performedBy:
        userId,
    });

    return candidate;
  };

const resolveCandidateType = (passingYear) => {
  if (typeof passingYear !== "number") {
    return null;
  }

  const currentYear = new Date().getFullYear();
  return passingYear <= currentYear ? "PASSOUT" : "STUDENT";
};

const validateCandidateOwnership = (candidate, userId, userRole) => {
  if (userRole === "HR" && String(candidate.assignedHR) !== String(userId)) {
    throw new AppError("Not authorized to modify this candidate", 403);
  }
};

const createProjectAuditAndTimeline = async (
  candidateId,
  userId,
  action,
  project,
  oldValue = null,
  projectIndex = null
) => {
  await createAuditLog({
    candidateId,
    fieldName: "projects",
    oldValue,
    newValue: project,
    changedBy: userId,
    reason: `Project ${action}`,
  });

  await createTimelineEvent({
    candidateId,
    eventType: `PROJECT_${action.toUpperCase()}`,
    title: `Project ${action}`,
    description: projectIndex !== null
      ? `${action} project at position ${projectIndex + 1}`
      : `${action} project ${project.title || "Unnamed"}`,
    metadata: { project, index: projectIndex },
    performedBy: userId,
  });
};

export const addSkill =
  async (
    candidateId,
    skill,
    userId,
    userRole
  ) => {
    if (!skill || !String(skill).trim()) {
      throw new AppError("Skill is required", 400);
    }

    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      throw new AppError("Candidate not found", 404);
    }

    validateCandidateOwnership(candidate, userId, userRole);

    const normalized = String(skill).trim();

    candidate.aiAnalysis = candidate.aiAnalysis || {};
    candidate.aiAnalysis.skills = candidate.aiAnalysis.skills || [];

    const profile = await CandidateProfile.findOne({ candidateId });
    if (profile) {
      profile.skills = profile.skills || [];
    }

    const exists = candidate.aiAnalysis.skills.find(
      (s) => String(s).toLowerCase() === normalized.toLowerCase()
    );
    if (exists) {
      return candidate;
    }

    const oldValue = candidate.aiAnalysis.skills.slice();

    candidate.aiAnalysis.skills.push(normalized);

    await candidate.save();

    if (profile) {
      const existsInProfile = profile.skills.find(
        (s) => String(s).toLowerCase() === normalized.toLowerCase()
      );
      if (!existsInProfile) {
        profile.skills.push(normalized);
        await profile.save();
      }
    }

    await createAuditLog({
      candidateId,
      fieldName: "aiAnalysis.skills",
      oldValue,
      newValue: candidate.aiAnalysis.skills,
      changedBy: userId,
      reason: "Skill added via UI",
    });

    await createTimelineEvent({
      candidateId,
      eventType: "SKILL_ADDED",
      title: "Skill Added",
      description: `Skill ${normalized} added`,
      metadata: { skill: normalized },
      performedBy: userId,
    });

    return candidate;
  };

export const addProject =
  async (
    candidateId,
    project,
    userId,
    userRole
  ) => {
    if (!project || !project.title || !project.description || !project.type) {
      throw new AppError("Project title, description and type are required", 400);
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      throw new AppError("Candidate not found", 404);
    }

    validateCandidateOwnership(candidate, userId, userRole);

    let profile = await CandidateProfile.findOne({ candidateId });
    if (!profile) {
      profile = await CandidateProfile.create({ candidateId, projects: [] });
    }

    profile.projects = profile.projects || [];
    const oldProjects = profile.projects.map((p) => ({ ...p.toObject?.() ?? p }));

    profile.projects.push({
      name: String(project.name).trim(),
      description: String(project.description).trim(),
      type: String(project.type).trim(),
    });

    await profile.save();

    await createProjectAuditAndTimeline(
      candidateId,
      userId,
      "Added",
      profile.projects[profile.projects.length - 1],
      oldProjects,
      profile.projects.length - 1
    );

    return candidate;
  };

export const updateProject =
  async (
    candidateId,
    projectIndex,
    project,
    userId,
    userRole
  ) => {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      throw new AppError("Candidate not found", 404);
    }

    validateCandidateOwnership(candidate, userId, userRole);

    const profile = await CandidateProfile.findOne({ candidateId });
    if (!profile || !Array.isArray(profile.projects) || projectIndex < 0 || projectIndex >= profile.projects.length) {
      throw new AppError("Project not found", 404);
    }

    const existing = profile.projects[projectIndex];
    const oldProject = { ...existing.toObject?.() ?? existing };
    const updatedProject = {
      name: project.name ? String(project.name).trim() : existing.name,
      description: project.description ? String(project.description).trim() : existing.description,
      type: project.type ? String(project.type).trim() : existing.type,
    };

    profile.projects[projectIndex] = updatedProject;
    await profile.save();

    await createProjectAuditAndTimeline(
      candidateId,
      userId,
      "Updated",
      updatedProject,
      oldProject,
      projectIndex
    );

    return candidate;
  };

export const deleteProject =
  async (
    candidateId,
    projectIndex,
    userId,
    userRole
  ) => {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      throw new AppError("Candidate not found", 404);
    }

    validateCandidateOwnership(candidate, userId, userRole);

    const profile = await CandidateProfile.findOne({ candidateId });
    if (!profile || !Array.isArray(profile.projects) || projectIndex < 0 || projectIndex >= profile.projects.length) {
      throw new AppError("Project not found", 404);
    }

    const removedProject = profile.projects[projectIndex];
    const oldProjects = profile.projects.map((p) => ({ ...p.toObject?.() ?? p }));
    profile.projects.splice(projectIndex, 1);

    await profile.save();

    await createProjectAuditAndTimeline(
      candidateId,
      userId,
      "Deleted",
      removedProject,
      oldProjects,
      projectIndex
    );

    return candidate;
  };

const createProfileAuditAndTimeline = async (
  candidateId,
  userId,
  action,
  field,
  oldValue,
  newValue,
  eventType,
  title,
  description,
  metadata = {}
) => {
  await createAuditLog({
    candidateId,
    fieldName: field,
    oldValue,
    newValue,
    changedBy: userId,
    reason: `${title} performed`,
  });

  await createTimelineEvent({
    candidateId,
    eventType,
    title,
    description,
    metadata,
    performedBy: userId,
  });
};

export const updateEducation =
  async (
    candidateId,
    payload,
    userId,
    userRole
  ) => {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      throw new AppError("Candidate not found", 404);
    }

    validateCandidateOwnership(candidate, userId, userRole);

    let profile = await CandidateProfile.findOne({ candidateId });
    if (!profile) {
      profile = await CandidateProfile.create({ candidateId });
    }

    const oldEducation = profile.education || [];
    const newEducation = Array.isArray(payload.education)
      ? payload.education
      : payload.education
      ? [payload.education]
      : [];

    if (JSON.stringify(oldEducation) !== JSON.stringify(newEducation)) {
      profile.education = newEducation.map((entry) => ({
        degree: String(entry.degree || "").trim(),
        institute: String(entry.institute || "").trim(),
        year: String(entry.year || "").trim(),
        cgpa: entry.cgpa !== undefined && entry.cgpa !== null ? Number(entry.cgpa) : undefined,
      }));
      await profile.save();

      await createProfileAuditAndTimeline(
        candidateId,
        userId,
        "Updated",
        "profile.education",
        oldEducation,
        profile.education,
        TIMELINE_EVENTS.EDUCATION_UPDATED,
        "Education Updated",
        "Candidate education details were updated",
        { education: profile.education }
      );
    }

    const profileFields = ["passingYear", "candidateType", "academicYear", "cgpa"];
    for (const field of profileFields) {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        const oldValue = profile[field];
        const newValue = payload[field];
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          profile[field] = field === "cgpa" ? Number(newValue) : newValue;
          await createAuditLog({
            candidateId,
            fieldName: `profile.${field}`,
            oldValue,
            newValue,
            changedBy: userId,
            reason: `Profile ${field} updated`,
          });
        }
      }
    }

    await profile.save();

    return candidate;
  };

export const addExperience =
  async (
    candidateId,
    payload,
    userId,
    userRole
  ) => {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      throw new AppError("Candidate not found", 404);
    }

    validateCandidateOwnership(candidate, userId, userRole);

    let profile = await CandidateProfile.findOne({ candidateId });
    if (!profile) {
      profile = await CandidateProfile.create({ candidateId });
    }

    profile.experience = profile.experience || [];
    const oldValue = profile.experience.map((item) => ({ ...item.toObject?.() ?? item }));
    const newEntry = {
      company: String(payload.company || "").trim(),
      role: String(payload.role || "").trim(),
      from: String(payload.from || "").trim(),
      to: String(payload.to || "").trim(),
      currentCompany: Boolean(payload.currentCompany),
      description: String(payload.description || "").trim(),
      experienceType: String(payload.experienceType || "Full Time").trim(),
    };

    if (!newEntry.company || !newEntry.role) {
      throw new AppError("Company and role are required", 400);
    }

    profile.experience.push(newEntry);
    await profile.save();

    await createProfileAuditAndTimeline(
      candidateId,
      userId,
      "Added",
      "profile.experience",
      oldValue,
      profile.experience,
      TIMELINE_EVENTS.EXPERIENCE_ADDED,
      "Experience Added",
      `Added experience at ${newEntry.company}`,
      { experience: newEntry, index: profile.experience.length - 1 }
    );

    return candidate;
  };

export const updateExperience =
  async (
    candidateId,
    experienceIndex,
    payload,
    userId,
    userRole
  ) => {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      throw new AppError("Candidate not found", 404);
    }

    validateCandidateOwnership(candidate, userId, userRole);

    const profile = await CandidateProfile.findOne({ candidateId });
    if (!profile || !Array.isArray(profile.experience) || experienceIndex < 0 || experienceIndex >= profile.experience.length) {
      throw new AppError("Experience not found", 404);
    }

    const existing = profile.experience[experienceIndex];
    const oldValue = { ...existing.toObject?.() ?? existing };

    const updatedExperience = {
      company: payload.company ? String(payload.company).trim() : existing.company,
      role: payload.role ? String(payload.role).trim() : existing.role,
      from: payload.from ? String(payload.from).trim() : existing.from,
      to: payload.to ? String(payload.to).trim() : existing.to,
      currentCompany: payload.currentCompany !== undefined ? Boolean(payload.currentCompany) : existing.currentCompany,
      description: payload.description ? String(payload.description).trim() : existing.description,
      experienceType: payload.experienceType ? String(payload.experienceType).trim() : existing.experienceType,
    };

    profile.experience[experienceIndex] = updatedExperience;
    await profile.save();

    await createProfileAuditAndTimeline(
      candidateId,
      userId,
      "Updated",
      "profile.experience",
      oldValue,
      updatedExperience,
      TIMELINE_EVENTS.EXPERIENCE_UPDATED,
      "Experience Updated",
      `Updated experience at ${updatedExperience.company}`,
      { experience: updatedExperience, index: experienceIndex }
    );

    return candidate;
  };

export const deleteExperience =
  async (
    candidateId,
    experienceIndex,
    userId,
    userRole
  ) => {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      throw new AppError("Candidate not found", 404);
    }

    validateCandidateOwnership(candidate, userId, userRole);

    const profile = await CandidateProfile.findOne({ candidateId });
    if (!profile || !Array.isArray(profile.experience) || experienceIndex < 0 || experienceIndex >= profile.experience.length) {
      throw new AppError("Experience not found", 404);
    }

    const removed = profile.experience[experienceIndex];
    const oldValue = profile.experience.map((item) => ({ ...item.toObject?.() ?? item }));
    profile.experience.splice(experienceIndex, 1);
    await profile.save();

    await createProfileAuditAndTimeline(
      candidateId,
      userId,
      "Deleted",
      "profile.experience",
      oldValue,
      profile.experience,
      TIMELINE_EVENTS.EXPERIENCE_DELETED,
      "Experience Deleted",
      `Deleted experience entry for ${removed.company}`,
      { experience: removed, index: experienceIndex }
    );

    return candidate;
  };

export const addCertification =
  async (
    candidateId,
    payload,
    userId,
    userRole
  ) => {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      throw new AppError("Candidate not found", 404);
    }

    validateCandidateOwnership(candidate, userId, userRole);

    let profile = await CandidateProfile.findOne({ candidateId });
    if (!profile) {
      profile = await CandidateProfile.create({ candidateId });
    }

    profile.certifications = profile.certifications || [];
    const oldValue = profile.certifications.map((item) => ({ ...item.toObject?.() ?? item }));
    const newEntry = {
      name: String(payload.name || "").trim(),
      issuer: String(payload.issuer || "").trim(),
      issueDate: payload.issueDate ? String(payload.issueDate).trim() : undefined,
      expiryDate: payload.expiryDate ? String(payload.expiryDate).trim() : undefined,
      certificateUrl: payload.certificateUrl ? String(payload.certificateUrl).trim() : undefined,
    };

    if (!newEntry.name || !newEntry.issuer) {
      throw new AppError("Certificate name and issuer are required", 400);
    }

    profile.certifications.push(newEntry);
    await profile.save();

    await createProfileAuditAndTimeline(
      candidateId,
      userId,
      "Added",
      "profile.certifications",
      oldValue,
      profile.certifications,
      TIMELINE_EVENTS.CERTIFICATION_ADDED,
      "Certification Added",
      `Added certification ${newEntry.name}`,
      { certification: newEntry, index: profile.certifications.length - 1 }
    );

    return candidate;
  };

export const updateCertification =
  async (
    candidateId,
    certificationIndex,
    payload,
    userId,
    userRole
  ) => {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      throw new AppError("Candidate not found", 404);
    }

    validateCandidateOwnership(candidate, userId, userRole);

    const profile = await CandidateProfile.findOne({ candidateId });
    if (!profile || !Array.isArray(profile.certifications) || certificationIndex < 0 || certificationIndex >= profile.certifications.length) {
      throw new AppError("Certification not found", 404);
    }

    const existing = profile.certifications[certificationIndex];
    const oldValue = { ...existing.toObject?.() ?? existing };
    const updatedCertification = {
      name: payload.name ? String(payload.name).trim() : existing.name,
      issuer: payload.issuer ? String(payload.issuer).trim() : existing.issuer,
      issueDate: payload.issueDate ? String(payload.issueDate).trim() : existing.issueDate,
      expiryDate: payload.expiryDate ? String(payload.expiryDate).trim() : existing.expiryDate,
      certificateUrl: payload.certificateUrl ? String(payload.certificateUrl).trim() : existing.certificateUrl,
    };

    profile.certifications[certificationIndex] = updatedCertification;
    await profile.save();

    await createProfileAuditAndTimeline(
      candidateId,
      userId,
      "Updated",
      "profile.certifications",
      oldValue,
      updatedCertification,
      TIMELINE_EVENTS.CERTIFICATION_UPDATED,
      "Certification Updated",
      `Updated certification ${updatedCertification.name}`,
      { certification: updatedCertification, index: certificationIndex }
    );

    return candidate;
  };

export const deleteCertification =
  async (
    candidateId,
    certificationIndex,
    userId,
    userRole
  ) => {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      throw new AppError("Candidate not found", 404);
    }

    validateCandidateOwnership(candidate, userId, userRole);

    const profile = await CandidateProfile.findOne({ candidateId });
    if (!profile || !Array.isArray(profile.certifications) || certificationIndex < 0 || certificationIndex >= profile.certifications.length) {
      throw new AppError("Certification not found", 404);
    }

    const removed = profile.certifications[certificationIndex];
    const oldValue = profile.certifications.map((item) => ({ ...item.toObject?.() ?? item }));
    profile.certifications.splice(certificationIndex, 1);
    await profile.save();

    await createProfileAuditAndTimeline(
      candidateId,
      userId,
      "Deleted",
      "profile.certifications",
      oldValue,
      profile.certifications,
      TIMELINE_EVENTS.CERTIFICATION_DELETED,
      "Certification Deleted",
      `Deleted certification ${removed.name}`,
      { certification: removed, index: certificationIndex }
    );

    return candidate;
  };

export const logCall =
  async (
    candidateId,
    payload,
    userId,
    userRole
  ) => {
    const { callNumber, outcome, interested, fitment, notes } = payload;

    if (!callNumber || ![1, 2, 3].includes(Number(callNumber))) {
      throw new AppError("callNumber must be 1, 2 or 3", 400);
    }

    if (!outcome) {
      throw new AppError("outcome is required", 400);
    }

    const allowedOutcomes = [
      "Answered",
      "Not Picked Up",
      "Busy",
      "Call Rejected",
      "Invalid Number",
    ];
    if (!allowedOutcomes.includes(outcome)) {
      throw new AppError("Invalid outcome", 400);
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) throw new AppError("Candidate not found", 404);

    validateCandidateOwnership(candidate, userId, userRole);

    if (callNumber === 2) {
      const hasFirst = (candidate.callHistory || []).some(
        (c) => c.callNumber === 1 && c.outcome
      );
      if (!hasFirst) throw new AppError("First call must be completed before second call", 400);
    }
    if (callNumber === 3) {
      const hasSecond = (candidate.callHistory || []).some(
        (c) => c.callNumber === 2 && c.outcome
      );
      if (!hasSecond) throw new AppError("Second call must be completed before third call", 400);
    }

    candidate.callHistory = candidate.callHistory || [];
    const callEntry = {
      callNumber: Number(callNumber),
      outcome,
      interestedStatus: interested || null,
      notes: notes || null,
      hr: userId,
      calledAt: new Date(),
    };

    candidate.callHistory.push(callEntry);

    const auditActions = [];
    const timelineEvents = [];

    const oldStatus = candidate.status;

    if (outcome === "Answered") {
      if (interested === "Yes") {
        candidate.status = CANDIDATE_STATUS.LINED_UP;

        auditActions.push({
          fieldName: "status",
          oldValue: oldStatus,
          newValue: CANDIDATE_STATUS.LINED_UP,
          reason: "Candidate interested after call",
        });

        timelineEvents.push({
          eventType: TIMELINE_EVENTS.CANDIDATE_LINED_UP,
          title: "Candidate Lined Up",
          description: `Candidate expressed interest after ${callNumber === 1 ? "first" : callNumber === 2 ? "second" : "third"} call`,
        });
      } else if (interested === "No") {
        if (callNumber === 3) {
          candidate.status = CANDIDATE_STATUS.DROPPED;
          candidate.dropReason = payload.dropReason || "Not Interested";

          auditActions.push({
            fieldName: "status",
            oldValue: oldStatus,
            newValue: CANDIDATE_STATUS.DROPPED,
            reason: "Candidate not interested after 3 calls",
          });

          timelineEvents.push({
            eventType: TIMELINE_EVENTS.DROPPED,
            title: "Candidate Dropped",
            description: candidate.dropReason,
          });
        } else {
          const callStatus = callNumber === 1 ? CANDIDATE_STATUS.FIRST_CALL_DONE : callNumber === 2 ? CANDIDATE_STATUS.SECOND_CALL_DONE : CANDIDATE_STATUS.THIRD_CALL_DONE;
          candidate.status = callStatus;

          auditActions.push({
            fieldName: "status",
            oldValue: oldStatus,
            newValue: callStatus,
            reason: `Call ${callNumber} completed`,
          });

          timelineEvents.push({
            eventType: TIMELINE_EVENTS.CALL_LOGGED,
            title: `Call ${callNumber} Completed`,
            description: `Candidate completed the ${callNumber === 1 ? "first" : callNumber === 2 ? "second" : "third"} call`,
          });
        }
      } else if (interested === "Will Think" || interested === "Will Call Back") {
        const callStatus = callNumber === 1 ? CANDIDATE_STATUS.FIRST_CALL_DONE : callNumber === 2 ? CANDIDATE_STATUS.SECOND_CALL_DONE : CANDIDATE_STATUS.THIRD_CALL_DONE;
        candidate.status = callStatus;

        auditActions.push({
          fieldName: "status",
          oldValue: oldStatus,
          newValue: callStatus,
          reason: `Call ${callNumber} completed`,
        });

        timelineEvents.push({
          eventType: TIMELINE_EVENTS.CALL_LOGGED,
          title: `Call ${callNumber} Completed`,
          description: `Candidate completed the ${callNumber === 1 ? "first" : callNumber === 2 ? "second" : "third"} call and requires follow-up`,
        });
      } else {
        const callStatus = callNumber === 1 ? CANDIDATE_STATUS.FIRST_CALL_DONE : callNumber === 2 ? CANDIDATE_STATUS.SECOND_CALL_DONE : CANDIDATE_STATUS.THIRD_CALL_DONE;
        candidate.status = callStatus;

        auditActions.push({
          fieldName: "status",
          oldValue: oldStatus,
          newValue: callStatus,
          reason: `Call ${callNumber} completed`,
        });

        timelineEvents.push({
          eventType: TIMELINE_EVENTS.CALL_LOGGED,
          title: `Call ${callNumber} Completed`,
          description: `Candidate completed the ${callNumber === 1 ? "first" : callNumber === 2 ? "second" : "third"} call`,
        });
      }
    }

    if (
      ["Not Picked Up", "Busy", "Call Rejected", "Invalid Number"].includes(
        outcome
      ) &&
      outcome === "Invalid Number" &&
      payload.drop === true
    ) {
      candidate.status = CANDIDATE_STATUS.DROPPED;
      candidate.dropReason = payload.dropReason || "Invalid Number";

      auditActions.push({
        fieldName: "status",
        oldValue: oldStatus,
        newValue: CANDIDATE_STATUS.DROPPED,
        reason: candidate.dropReason,
      });

      timelineEvents.push({
        eventType: "CANDIDATE_DROPPED",
        title: "Candidate Dropped",
        description: candidate.dropReason,
      });
    }

    if (
      Number(callNumber) === 3 &&
      ["Not Picked Up", "Busy", "Call Rejected", "Invalid Number"].includes(outcome) &&
      payload.dropAfter3 === true
    ) {
      candidate.status = CANDIDATE_STATUS.DROPPED;
      candidate.dropReason = payload.dropReason || "No Response After 3 Attempts";

      auditActions.push({
        fieldName: "status",
        oldValue: oldStatus,
        newValue: CANDIDATE_STATUS.DROPPED,
        reason: candidate.dropReason,
      });

      timelineEvents.push({
        eventType: "CANDIDATE_DROPPED",
        title: "Candidate Dropped",
        description: candidate.dropReason,
      });
    }

    await candidate.save();

    for (const audit of auditActions) {
      await createAuditLog({
        candidateId,
        fieldName: audit.fieldName,
        oldValue: audit.oldValue,
        newValue: audit.newValue,
        changedBy: userId,
        reason: audit.reason,
      });
    }

    for (const event of timelineEvents) {
      await createTimelineEvent({
        candidateId,
        ...event,
        performedBy: userId,
      });
    }

    await createAuditLog({
      candidateId,
      fieldName: "callHistory",
      oldValue: null,
      newValue: callEntry,
      changedBy: userId,
      reason: `Call logged: ${outcome}`,
    });

    await createTimelineEvent({
      candidateId,
      eventType: `CALL_${callEntry.callNumber}_COMPLETED`,
      title: `Call ${callEntry.callNumber} Completed`,
      description: `Outcome: ${outcome}` + (notes ? `; Notes: ${notes}` : ""),
      metadata: { call: callEntry },
      performedBy: userId,
    });

    return { candidate, call: callEntry };
  };