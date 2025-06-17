import express from 'express';
import Family from '../models/Family.js';
import Iuran from '../models/Iuran.js';

const router = express.Router();

// GET /api/statistik - Get aggregated statistics
router.get('/', async (req, res) => {
  try {
    // Get family statistics
    const totalFamilies = await Family.countDocuments();
    
    // Get total ahli kubur count
    const familiesWithCounts = await Family.aggregate([
      {
        $project: {
          ahliKuburCount: { $size: '$ahliKubur' }
        }
      },
      {
        $group: {
          _id: null,
          totalAhliKubur: { $sum: '$ahliKuburCount' }
        }
      }
    ]);
    
    const totalAhliKubur = familiesWithCounts.length > 0 ? familiesWithCounts[0].totalAhliKubur : 0;

    // Get distribution per RT
    const rtDistribution = await Family.aggregate([
      {
        $unwind: '$ahliKubur'
      },
      {
        $group: {
          _id: '$rt',
          families: { $addToSet: '$_id' },
          ahliKubur: { $sum: 1 }
        }
      },
      {
        $project: {
          rt: '$_id',
          families: { $size: '$families' },
          ahliKubur: 1,
          _id: 0
        }
      },
      {
        $sort: { rt: 1 }
      }
    ]);

    // Get financial statistics
    const financialStats = await Iuran.aggregate([
      {
        $group: {
          _id: '$rt',
          totalNominal: { $sum: '$nominal' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          rt: '$_id',
          totalNominal: 1,
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { rt: 1 }
      }
    ]);

    // Calculate total contribution
    const totalContribution = await Iuran.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$nominal' }
        }
      }
    ]);

    const totalIuran = totalContribution.length > 0 ? totalContribution[0].total : 0;

    // Ensure all RTs are represented in distribution
    const allRTs = ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06'];
    const completeRtDistribution = allRTs.map(rt => {
      const existing = rtDistribution.find(item => item.rt === rt);
      return existing || { rt, families: 0, ahliKubur: 0 };
    });

    // Ensure all RTs are represented in financial stats
    const completeFinancialStats = allRTs.map(rt => {
      const existing = financialStats.find(item => item.rt === rt);
      return existing || { rt, totalNominal: 0, count: 0 };
    });

    res.json({
      totalFamilies,
      totalAhliKubur,
      totalIuran,
      rtDistribution: completeRtDistribution,
      financialStats: completeFinancialStats,
      summary: {
        activeRTs: rtDistribution.filter(rt => rt.ahliKubur > 0).length,
        averageAhliKuburPerFamily: totalFamilies > 0 ? Math.round(totalAhliKubur / totalFamilies * 100) / 100 : 0,
        averageIuranPerRT: completeFinancialStats.filter(rt => rt.count > 0).length > 0 
          ? Math.round(totalIuran / completeFinancialStats.filter(rt => rt.count > 0).length) 
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ 
      error: 'Gagal mengambil data statistik',
      message: error.message 
    });
  }
});

export default router;