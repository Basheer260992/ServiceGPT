import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true, index: true },
    shortDescription: { type: String, required: true },
    description: String,
    priority: { type: String, enum: ['Critical', 'High', 'Moderate', 'Low'], default: 'Moderate' },
    category: String,
    assignmentGroup: String,
    state: { type: String, enum: ['New', 'Root Cause Analysis', 'Known Error', 'Resolved', 'Closed'], default: 'New' },
    impact: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    urgency: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    requestedBy: String,
    assignedTo: String,
    relatedIncidents: [String],
    attachments: [{ name: String, size: Number, dataUrl: String }],
  },
  { timestamps: true }
);

export default mongoose.models.Problem || mongoose.model('Problem', problemSchema);
