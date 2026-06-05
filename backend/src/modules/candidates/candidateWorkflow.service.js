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
        // Set candidate to LINED_UP status
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
        // Only drop if it's the 3rd call
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
        }
        // Otherwise, just log the call and keep the candidate in their current status for follow-up attempts
      } else if (interested === "Will Think" || interested === "Will Call Back") {
        // Log the call without changing status - keep for follow-up
        timelineEvents.push({
          eventType: TIMELINE_EVENTS.CALL_LOGGED,
          title: "Follow-up Required",
          description: `Follow-up needed: ${interested}`,
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