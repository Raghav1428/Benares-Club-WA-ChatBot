import { supabase } from "../supabase/index.supabase.js";

export class FeedbackController {
  
  /**
   * Get all feedback records with optional filtering
   * @param {Object} filters - Filter options
   * @param {string} filters.fromPhone - Filter by phone number
   * @param {string} filters.category - Filter by category
   * @param {boolean} filters.processed - Filter by processed status
   * @param {boolean} filters.hasMedia - Filter records with/without media
   * @param {string} filters.dateFrom - Filter from date (YYYY-MM-DD)
   * @param {string} filters.dateTo - Filter to date (YYYY-MM-DD)
   * @param {string} filters.search - Search in caption text
   * @param {number} filters.limit - Limit number of results (default: 50)
   * @param {number} filters.offset - Offset for pagination (default: 0)
   * @param {string} filters.sortBy - Sort field (default: 'created_at')
   * @param {string} filters.sortOrder - Sort order 'asc' or 'desc' (default: 'desc')
   * @param {string} id - Feedback ID
   * @param {boolean} processed - Processed status
   * @param {string} userId - UUID of the user processing the feedback
   */
  static async getAllFeedback(filters = {}) {
    try {
      const {
        fromPhone,
        category,
        processed,
        hasMedia,
        dateFrom,
        dateTo,
        search,
        name,
        membershipNumber,
        suggestion,
        processedBy,
        limit = 50,
        offset = 0,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = filters;

      let query = supabase
        .from('feedback')
        .select('*', { count: 'exact' });

      if (fromPhone) query = query.eq('from_phone', fromPhone);
      if (category) query = query.eq('category', category);
      if (typeof processed === 'boolean') query = query.eq('processed', processed);
      if (processedBy) query = query.eq('processed_by', processedBy);
      if (name) query = query.ilike('name', `%${name}%`);
      if (membershipNumber) query = query.ilike('membership_number', `%${membershipNumber}%`);
      if (suggestion) query = query.ilike('suggestion', `%${suggestion}%`);
      if (typeof hasMedia === 'boolean') {
        query = hasMedia
          ? query.not('media_url', 'is', null)
          : query.is('media_url', null);
      }

      if (dateFrom) query = query.gte('created_at', `${dateFrom}T00:00:00`);
      if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59`);
      if (search) query = query.ilike('caption', `%${search}%`);

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data,
        count,
        pagination: {
          limit,
          offset,
          total: count,
          hasMore: count > offset + limit
        }
      };
    } catch (error) {
      console.error('Controller error in getAllFeedback:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get feedback by ID
   * @param {string} id - Feedback ID
   */
  static async getFeedbackById(id) {
    try {
      if (!id) {
        throw new Error('Feedback ID is required');
      }

      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Feedback not found',
            data: null
          };
        }
        throw error;
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Controller error in getFeedbackById:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Update feedback processed status
   * @param {string} id - Feedback ID
   * @param {boolean} processed - Processed status
   */
  static async updateProcessedStatus(id, processed) {
    try {
      if (!id) {
        throw new Error('Feedback ID is required');
      }

      if (typeof processed !== 'boolean') {
        throw new Error('Processed status must be a boolean');
      }

      const { data, error } = await supabase
        .from('feedback')
        .update({ processed })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data,
        message: `Feedback marked as ${processed ? 'processed' : 'unprocessed'}`
      };

    } catch (error) {
      console.error('Controller error in updateProcessedStatus:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Delete feedback by ID (admin only)
   * @param {string} id - Feedback ID
   * @param {string} userId - User ID of the one attempting deletion
   */
  static async deleteFeedback(id, userId) {
    try {
      if (!id) throw new Error('Feedback ID is required');
      if (!userId) throw new Error('User ID is required');

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (userError) throw userError;
      if (!user || user.role !== 'admin') {
        return {
          success: false,
          error: 'Unauthorized: Only admin can delete feedback',
          data: null
        };
      }

      const { data, error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Feedback deleted successfully'
      };

    } catch (error) {
      console.error('Controller error in deleteFeedback:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }


  /**
   * Get feedback statistics
   */
  static async getFeedbackStats() {
    try {

      const { count: totalCount, error: totalError } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      const { count: processedCount, error: processedError } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true })
        .eq('processed', true);

      if (processedError) throw processedError;

      const { count: mediaCount, error: mediaError } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true })
        .not('media_url', 'is', null);

      if (mediaError) throw mediaError;

      const { data: categoryData, error: categoryError } = await supabase
        .from('feedback')
        .select('category')
        .not('category', 'is', null);

      if (categoryError) throw categoryError;

      const categoryStats = categoryData.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {});

      return {
        success: true,
        data: {
          total: totalCount,
          processed: processedCount,
          unprocessed: totalCount - processedCount,
          withMedia: mediaCount,
          withoutMedia: totalCount - mediaCount,
          categories: categoryStats
        }
      };

    } catch (error) {
      console.error('Controller error in getFeedbackStats:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get unique categories
   */
  static async getCategories() {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;

      const uniqueCategories = [...new Set(data.map(item => item.category))];

      return {
        success: true,
        data: uniqueCategories
      };

    } catch (error) {
      console.error('Controller error in getCategories:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get unique phone numbers
   */
  static async getPhoneNumbers() {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('from_phone');

      if (error) throw error;

      const uniquePhones = [...new Set(data.map(item => item.from_phone))];

      return {
        success: true,
        data: uniquePhones
      };

    } catch (error) {
      console.error('Controller error in getPhoneNumbers:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Update feedback processed status and processed_by field
   * @param {string} id - Feedback ID
   * @param {boolean} processed - Processed status
   * @param {string} userId - UUID of the user processing the feedback
   */
  static async updateProcessedStatus(id, processed, userId) {
    try {
      if (!id) throw new Error('Feedback ID is required');
      if (typeof processed !== 'boolean') throw new Error('Processed status must be a boolean');
      if (!userId) throw new Error('User ID is required');

      const updateFields = { processed };
      if (processed) {
        updateFields.processed_by = userId;
      } else {
        updateFields.processed_by = null;
      }

      const { data, error } = await supabase
        .from('feedback')
        .update(updateFields)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: `Feedback marked as ${processed ? 'processed' : 'unprocessed'}`
      };

    } catch (error) {
      console.error('Controller error in updateProcessedStatus:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

}