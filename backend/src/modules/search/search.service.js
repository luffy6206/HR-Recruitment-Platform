import Candidate from "../candidates/candidate.model.js";
import Interview from "../interviews/interview.model.js";

export const globalSearch =
  async (params) => {
    const { q, name, email, phone, category, skill, college, assignedHR, status, interviewDate } = params;
    
    const filter = {
      isDeleted: false,
    };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ];
    }

    if (name) filter.name = { $regex: name, $options: "i" };
    if (email) filter.email = { $regex: email, $options: "i" };
    if (phone) filter.phone = { $regex: phone, $options: "i" };
    if (category) filter.category = { $regex: category, $options: "i" };
    
    if (skill) filter["aiAnalysis.skills"] = { $regex: skill, $options: "i" };
    if (college) filter["aiAnalysis.education"] = { $regex: college, $options: "i" };
    
    if (assignedHR) filter.assignedHR = assignedHR;
    if (status) filter.status = status;

    if (interviewDate) {
      const startOfDay = new Date(interviewDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(interviewDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const interviews = await Interview.find({
        scheduledAt: { $gte: startOfDay, $lte: endOfDay }
      }).select("candidateId");
      
      const candidateIds = interviews.map(i => i.candidateId);
      
      if (filter._id) {
        filter._id = { $in: [...new Set([...(filter._id.$in || []), ...candidateIds])] };
      } else {
        filter._id = { $in: candidateIds };
      }
    }

    return Candidate.find(filter)
      .limit(20)
      .sort({
        createdAt: -1,
      });
  };