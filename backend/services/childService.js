const Child = require('../models/Child');
const VaccinationSchedule = require('../models/VaccinationSchedule');
const ChildVaccinationStatus = require('../models/ChildVaccinationStatus');


class ChildService {
  // Helper function to calculate age in months
  calculateAgeInMonths(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    
    let months = (today.getFullYear() - birth.getFullYear()) * 12;
    months -= birth.getMonth();
    months += today.getMonth();
    
    return months <= 0 ? 0 : months;
  }

  // Helper function to generate vaccination schedule for a child
  async generateChildVaccinationSchedule(childId, birthDate) {
    try {
      const ageInMonths = this.calculateAgeInMonths(birthDate);
      
      // Get all vaccination schedules
      const schedules = await VaccinationSchedule.find().sort({ ageInMonths: 1, doseNumber: 1 });
      
      const vaccinationStatuses = [];
      
      for (const schedule of schedules) {
        const scheduledDate = new Date(birthDate);
        scheduledDate.setMonth(scheduledDate.getMonth() + schedule.ageInMonths);
        
        // Determine status based on current age with corrected logic
        let status = 'pending';
        
        if (ageInMonths >= schedule.ageInMonths) {
          // Child is old enough for this vaccine
          // Give a grace period of 1 month after the scheduled age
          const gracePeriodEnd = schedule.ageInMonths + 1;
          
          if (ageInMonths <= gracePeriodEnd) {
            status = 'pending'; // Within the acceptable window
          } else {
            status = 'overdue'; // Past the grace period
          }
        } else {
          status = 'pending'; // Child not old enough yet
        }
        
        const vaccinationStatus = {
          childId,
          vaccineName: schedule.vaccineName,
          visitAge: schedule.visitAge,
          ageInMonths: schedule.ageInMonths,
          doseNumber: schedule.doseNumber,
          totalDoses: schedule.totalDoses,
          status,
          scheduledDate,
          reminderSent: false
        };
        
        vaccinationStatuses.push(vaccinationStatus);
      }
      
      // Insert vaccination statuses
      await ChildVaccinationStatus.insertMany(vaccinationStatuses);
      
      return vaccinationStatuses;
    } catch (error) {
      throw new Error(`Failed to generate vaccination schedule: ${error.message}`);
    }
  }

  // Regenerate child IDs for existing children (to fix format issues)
  async regenerateChildIds() {
    try {
      const children = await Child.find({}).populate('parent', 'nationalId fullName');
      let updatedCount = 0;
      
      for (const child of children) {
        if (child.parent && child.parent.nationalId && /^\d{10}$/.test(child.parent.nationalId)) {
          // Check if child ID is already in correct format
          if (!/^CH\d{10}-\d{3}$/.test(child.childId)) {
            // Count existing children for this parent to get correct sequence
            const existingChildrenCount = await Child.countDocuments({
              parent: child.parent._id,
              _id: { $lt: child._id } // Count children created before this one
            });
            
            const newChildId = `CH${child.parent.nationalId}-${String(existingChildrenCount + 1).padStart(3, '0')}`;
            
            // Update the child ID
            await Child.findByIdAndUpdate(child._id, { childId: newChildId });
            console.log(`🔄 Regenerated child ID: ${child.childId} → ${newChildId}`);
            updatedCount++;
          }
        }
      }
      
      console.log(`✅ Regenerated ${updatedCount} child IDs`);
      return { updatedCount };
    } catch (error) {
      throw new Error(`Failed to regenerate child IDs: ${error.message}`);
    }
  }

  // Get all children for a parent
  async getChildrenByParent(parentId) {
    try {
      const children = await Child.findByParent(parentId);
      return children;
    } catch (error) {
      throw new Error(`Failed to get children: ${error.message}`);
    }
  }

  // Add a new child
  async addChild(childData, parentId) {
    try {
      // Check if child with same birth certificate already exists (if provided)
      if (childData.birthCertificateNumber) {
        const existingChild = await Child.findOne({
          birthCertificateNumber: childData.birthCertificateNumber,
          isActive: true
        });
        
        if (existingChild) {
          throw new Error('Child with this birth certificate number already exists');
        }
      }
      
      // Create child data
      const newChildData = {
        ...childData,
        parent: parentId,
        dateOfBirth: new Date(childData.dateOfBirth)
      };
      
      console.log('🔍 Creating child with data:', {
        parentId: parentId,
        parentIdType: typeof parentId,
        parentIdString: parentId.toString(),
        childData: newChildData
      });
      
      // Calculate current age
      const ageInMonths = this.calculateAgeInMonths(newChildData.dateOfBirth);
      newChildData.currentAge = {
        years: Math.floor(ageInMonths / 12),
        months: ageInMonths % 12
      };
      
      // Create child
      const child = new Child(newChildData);
      console.log('🔍 Child object created, parent field:', child.parent);
      
      await child.save();
      console.log('🔍 Child saved with ID:', child.childId);
      
      // Generate vaccination schedule for this child
      await this.generateChildVaccinationSchedule(child._id, newChildData.dateOfBirth);
      
      // Get the complete child data with vaccination status
      const completeChild = await Child.findOne({ childId: child.childId });
      
      return completeChild;
    } catch (error) {
      throw new Error(`Failed to add child: ${error.message}`);
    }
  }

  // Get specific child details
  async getChildDetails(childId, user) {
    try {
      let child;
      
      if (user.userType === 'admin') {
        child = await Child.findOne({ childId, isActive: true });
      } else if (user.userType === 'healthcare_provider') {
        child = await Child.findOne({ childId, isActive: true });
      } else if (user.userType === 'parent') {
        child = await Child.findOne({ 
          childId, 
          parent: user._id,
          isActive: true 
        });
      }
      
      if (!child) {
        throw new Error('Child not found or access denied');
      }
      
      return child;
    } catch (error) {
      throw new Error(`Failed to get child details: ${error.message}`);
    }
  }

  // Update child information
  async updateChild(childId, updateData, user) {
    try {
      // Verify access to child
      let child;
      if (user.userType === 'admin') {
        child = await Child.findOne({ childId, isActive: true });
      } else if (user.userType === 'parent') {
        child = await Child.findOne({ 
          childId, 
          parent: user.walletAddress,
          isActive: true 
        });
      }
      
      if (!child) {
        throw new Error('Child not found or access denied');
      }
      
      // Only allow updating certain fields
      const allowedFields = ['emergencyContact', 'allergies', 'medicalConditions', 'notes'];
      const filteredData = {};
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });
      
      const updatedChild = await Child.findOneAndUpdate(
        { childId: child.childId },
        filteredData,
        { new: true, runValidators: true }
      );
      
      return updatedChild;
    } catch (error) {
      throw new Error(`Failed to update child: ${error.message}`);
    }
  }

  // Delete/deactivate a child
  async deactivateChild(childId, user) {
    try {
      // Verify access to child
      let child;
      if (user.userType === 'admin') {
        child = await Child.findOne({ childId, isActive: true });
      } else if (user.userType === 'parent') {
        child = await Child.findOne({ 
          childId, 
          parent: user._id,
          isActive: true 
        });
      }
      
      if (!child) {
        throw new Error('Child not found or access denied');
      }
      
      // Soft delete - mark as inactive
      await Child.findOneAndUpdate(
        { childId: child.childId },
        { isActive: false }
      );
      
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to deactivate child: ${error.message}`);
    }
  }

  // Get child's vaccination schedule and status
  async getChildVaccinations(childId, user) {
    try {
      // Verify access to child
      let child;
      if (user.userType === 'admin') {
        child = await Child.findOne({ childId, isActive: true });
      } else if (user.userType === 'parent') {
        child = await Child.findOne({ 
          childId, 
          parent: user._id,
          isActive: true 
        });
      }
      
      if (!child) {
        throw new Error('Child not found or access denied');
      }
      
      return {
        childInfo: {
          childId: child.childId,
          fullName: child.fullName,
          dateOfBirth: child.dateOfBirth
        }
      };
    } catch (error) {
      throw new Error(`Failed to get child vaccinations: ${error.message}`);
    }
  }

  // Get upcoming vaccinations for a child
  async getUpcomingVaccinations(childId, days = 30, user) {
    try {
      // Verify access to child
      let child;
      if (user.userType === 'admin') {
        child = await Child.findOne({ childId, isActive: true });
      } else if (user.userType === 'parent') {
        child = await Child.findOne({ 
          childId, 
          parent: user._id,
          isActive: true 
        });
      }
      
      if (!child) {
        throw new Error('Child not found or access denied');
      }
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + parseInt(days));
      
      return {
        upcoming: [],
        childInfo: {
          childId: child.childId,
          fullName: child.fullName
        }
      };
    } catch (error) {
      throw new Error(`Failed to get upcoming vaccinations: ${error.message}`);
    }
  }

  // Get all children with filters (admin)
  async getAllChildren(filters, pagination) {
    try {
      const { page = 1, limit = 20, search, city, ageGroup, vaccinationStatus } = filters;
      
      let query = { isActive: true };

      // Apply filters
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { childId: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (city) {
        query['address.city'] = city;
      }
      
      if (ageGroup) {
        const now = new Date();
        const ageRanges = {
          'infant': { $gte: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()) },
          'toddler': { 
            $gte: new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()),
            $lt: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          },
          'school': { $lt: new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()) }
        };
        
        if (ageRanges[ageGroup]) {
          query.dateOfBirth = ageRanges[ageGroup];
        }
      }
      
      if (vaccinationStatus) {
        query['vaccinationStatus.status'] = vaccinationStatus;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const children = await Child.find(query)
        .populate('parent', 'fullName nationalId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Child.countDocuments(query);

      return {
        children,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get all children: ${error.message}`);
    }
  }

  // Get children statistics (admin)
  async getChildrenStatistics() {
    try {
      // Get basic children statistics
      const childrenStats = await Promise.all([
        Child.countDocuments({ isActive: true }),
        Child.countDocuments({ 
          isActive: true,
          'currentAge.years': { $lt: 1 }
        }),
        Child.countDocuments({ 
          isActive: true,
          'currentAge.years': { $gte: 1, $lt: 5 }
        }),
        Child.countDocuments({ 
          isActive: true,
          'currentAge.years': { $gte: 5 }
        })
      ]);

      const [totalChildren, infants, toddlers, schoolAge] = childrenStats;

      // Get vaccination status overview
      const vaccinationOverview = await Child.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalRequired: { $sum: '$vaccinationStatus.totalRequired' },
            totalCompleted: { $sum: '$vaccinationStatus.completed' },
            averageCompletion: { $avg: '$vaccinationStatus.completionRate' }
          }
        }
      ]);

      // Get children by city
      const childrenByCity = await Child.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$address.city',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      // Get recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentRegistrations = await Child.countDocuments({
        isActive: true,
        createdAt: { $gte: thirtyDaysAgo }
      });

      return {
        summary: {
          totalChildren,
          infants,
          toddlers,
          schoolAge,
          recentRegistrations
        },
        vaccinationOverview: vaccinationOverview[0] || {
          totalRequired: 0,
          totalCompleted: 0,
          averageCompletion: 0
        },
        childrenByCity
      };
    } catch (error) {
      throw new Error(`Failed to get children statistics: ${error.message}`);
    }
  }
}

module.exports = new ChildService();
