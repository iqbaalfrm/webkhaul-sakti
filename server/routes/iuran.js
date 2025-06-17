import express from 'express';
import Iuran from '../models/Iuran.js';

const router = express.Router();

// GET /api/iuran - Get all iuran records
router.get('/', async (req, res) => {
  try {
    const { rt, page = 1, limit = 50 } = req.query;
    
    // Build query
    const query = {};
    if (rt) query.rt = rt;

    // Execute query with pagination
    const iuranRecords = await Iuran.find(query)
      .sort({ tanggal: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Iuran.countDocuments(query);

    res.json({
      iuranRecords,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching iuran records:', error);
    res.status(500).json({ 
      error: 'Gagal mengambil data iuran',
      message: error.message 
    });
  }
});

// GET /api/iuran/:id - Get single iuran record
router.get('/:id', async (req, res) => {
  try {
    const iuran = await Iuran.findById(req.params.id);
    if (!iuran) {
      return res.status(404).json({ error: 'Data iuran tidak ditemukan' });
    }
    res.json(iuran);
  } catch (error) {
    console.error('Error fetching iuran:', error);
    res.status(500).json({ 
      error: 'Gagal mengambil data iuran',
      message: error.message 
    });
  }
});

// POST /api/iuran - Create new iuran record
router.post('/', async (req, res) => {
  try {
    const { rt, nominal, tanggal, keterangan } = req.body;

    // Validate required fields
    if (!rt || !nominal || !tanggal) {
      return res.status(400).json({ 
        error: 'Data tidak lengkap',
        message: 'RT, nominal, dan tanggal harus diisi'
      });
    }

    // Validate nominal
    const nominalNum = parseInt(nominal);
    if (isNaN(nominalNum) || nominalNum <= 0) {
      return res.status(400).json({ 
        error: 'Nominal tidak valid',
        message: 'Nominal harus berupa angka positif'
      });
    }

    const iuran = new Iuran({
      rt,
      nominal: nominalNum,
      tanggal: new Date(tanggal),
      keterangan: keterangan || ''
    });

    const savedIuran = await iuran.save();
    res.status(201).json({
      message: 'Data iuran berhasil disimpan',
      iuran: savedIuran
    });
  } catch (error) {
    console.error('Error creating iuran:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Data tidak valid',
        message: errors.join(', ')
      });
    }
    res.status(500).json({ 
      error: 'Gagal menyimpan data iuran',
      message: error.message 
    });
  }
});

// PUT /api/iuran/:id - Update iuran record
router.put('/:id', async (req, res) => {
  try {
    const { rt, nominal, tanggal, keterangan } = req.body;

    // Validate required fields
    if (!rt || !nominal || !tanggal) {
      return res.status(400).json({ 
        error: 'Data tidak lengkap',
        message: 'RT, nominal, dan tanggal harus diisi'
      });
    }

    // Validate nominal
    const nominalNum = parseInt(nominal);
    if (isNaN(nominalNum) || nominalNum <= 0) {
      return res.status(400).json({ 
        error: 'Nominal tidak valid',
        message: 'Nominal harus berupa angka positif'
      });
    }

    const updatedIuran = await Iuran.findByIdAndUpdate(
      req.params.id,
      {
        rt,
        nominal: nominalNum,
        tanggal: new Date(tanggal),
        keterangan: keterangan || ''
      },
      { new: true, runValidators: true }
    );

    if (!updatedIuran) {
      return res.status(404).json({ error: 'Data iuran tidak ditemukan' });
    }

    res.json({
      message: 'Data iuran berhasil diperbarui',
      iuran: updatedIuran
    });
  } catch (error) {
    console.error('Error updating iuran:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Data tidak valid',
        message: errors.join(', ')
      });
    }
    res.status(500).json({ 
      error: 'Gagal memperbarui data iuran',
      message: error.message 
    });
  }
});

// DELETE /api/iuran/:id - Delete iuran record
router.delete('/:id', async (req, res) => {
  try {
    const deletedIuran = await Iuran.findByIdAndDelete(req.params.id);
    
    if (!deletedIuran) {
      return res.status(404).json({ error: 'Data iuran tidak ditemukan' });
    }

    res.json({
      message: 'Data iuran berhasil dihapus',
      iuran: deletedIuran
    });
  } catch (error) {
    console.error('Error deleting iuran:', error);
    res.status(500).json({ 
      error: 'Gagal menghapus data iuran',
      message: error.message 
    });
  }
});

export default router;