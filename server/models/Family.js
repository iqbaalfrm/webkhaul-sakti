import mongoose from 'mongoose';

const ahliKuburSchema = new mongoose.Schema({
  namaAhliKubur: {
    type: String,
    required: [true, 'Nama ahli kubur harus diisi'],
    trim: true
  },
  binBinti: {
    type: String,
    required: [true, 'Bin/Binti harus dipilih'],
    enum: ['Bin', 'Binti']
  },
  namaOrangTua: {
    type: String,
    required: [true, 'Nama orang tua harus diisi'],
    trim: true
  }
}, { _id: true });

const familySchema = new mongoose.Schema({
  rt: {
    type: String,
    required: [true, 'RT harus dipilih'],
    enum: ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06']
  },
  namaKeluarga: {
    type: String,
    required: [true, 'Nama keluarga harus diisi'],
    trim: true
  },
  ahliKubur: {
    type: [ahliKuburSchema],
    validate: {
      validator: function(arr) {
        return arr && arr.length > 0;
      },
      message: 'Minimal satu data ahli kubur harus diisi'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
familySchema.index({ rt: 1 });
familySchema.index({ namaKeluarga: 1 });
familySchema.index({ rt: 1, namaKeluarga: 1 });

// Virtual for total ahli kubur count
familySchema.virtual('totalAhliKubur').get(function() {
  return this.ahliKubur ? this.ahliKubur.length : 0;
});

export default mongoose.model('Family', familySchema);