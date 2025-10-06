import { supabase, supabaseAdmin, Project, ProjectInsert, ProjectUpdate, ProjectStats } from './supabase';

export const projectService = {
  /**
   * Create a new project in Supabase
   */
  async createProject(projectData: Partial<ProjectInsert>): Promise<Project> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert([{
        ...projectData
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating project:', error);
      throw new Error(`Failed to create project: ${error.message}`);
    }
    
    return data;
  },

  /**
   * Get all projects
   */
  async getAllProjects(): Promise<Project[]> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects:', error);
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }
    
    return data || [];
  },

  /**
   * Get projects by owner address
   */
  async getProjectsByOwner(ownerAddress: string): Promise<Project[]> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('owner_address', ownerAddress.toLowerCase())
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects by owner:', error);
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }
    
    return data || [];
  },

  /**
   * Get project by app_id
   */
  async getProjectByAppId(appId: string): Promise<Project | null> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('app_id', appId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching project:', error);
      throw new Error(`Failed to fetch project: ${error.message}`);
    }
    
    return data;
  },

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<Project | null> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching project:', error);
      throw new Error(`Failed to fetch project: ${error.message}`);
    }
    
    return data;
  },

  /**
   * Update blockchain registration
   */
  async updateBlockchainRegistration(
    appId: string,
    txHash: string
  ): Promise<Project> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .update({
        blockchain_tx_hash: txHash,
        updated_at: new Date().toISOString()
      })
      .eq('app_id', appId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating blockchain registration:', error);
      throw new Error(`Failed to update registration: ${error.message}`);
    }
    
    return data;
  },

  /**
   * Update project
   */
  async updateProject(appId: string, updates: ProjectUpdate): Promise<Project> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('app_id', appId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating project:', error);
      throw new Error(`Failed to update project: ${error.message}`);
    }
    
    return data;
  },

  /**
   * Delete project
   */
  async deleteProject(appId: string): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }
    
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('app_id', appId);
    
    if (error) {
      console.error('Error deleting project:', error);
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  },

  /**
   * Get projects by category
   */
  async getProjectsByCategory(category: string): Promise<Project[]> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects by category:', error);
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }
    
    return data || [];
  },

  /**
   * Get project statistics
   */
  async getProjectStats(): Promise<ProjectStats[]> {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available');
      return [];
    }
    
    try {
      const { data, error } = await supabaseAdmin
        .from('project_user_stats')
        .select('*')
        .order('last_updated', { ascending: false });
      
      if (error) {
        console.error('Error fetching project stats:', error);
        // Return empty array instead of throwing error to prevent API failures
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error('Exception fetching project stats:', err);
      // Return empty array for any unexpected errors
      return [];
    }
  },

  /**
   * Check if app_id exists
   */
  async appIdExists(appId: string): Promise<boolean> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('app_id')
      .eq('app_id', appId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return false;
      }
      throw error;
    }
    
    return !!data;
  },

  /**
   * Get active projects count
   */
  async getActiveProjectsCount(): Promise<number> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }
    
    const { count, error } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error counting projects:', error);
      return 0;
    }
    
    return count || 0;
  },

  /**
   * Search projects by name or description
   */
  async searchProjects(query: string): Promise<Project[]> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .or(`app_name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error searching projects:', error);
      throw new Error(`Failed to search projects: ${error.message}`);
    }
    
    return data || [];
  },

  /**
   * Update blockchain status for a project
   */
  async updateBlockchainStatus(appId: string, txHash: string, status: string): Promise<Project> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    // First check if project exists
    const { data: existingProject, error: checkError } = await supabaseAdmin
      .from('projects')
      .select('app_id')
      .eq('app_id', appId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking project existence:', checkError);
      throw new Error(`Failed to check project: ${checkError.message}`);
    }

    if (!existingProject) {
      throw new Error(`Project with app_id '${appId}' not found. Please create the project first.`);
    }

    const updateData: any = {};
    
    if (status === 'confirmed') {
      updateData.blockchain_tx_hash = txHash;
    }
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('app_id', appId)
      .select()
      .single();

    if (error) {
      console.error('Error updating blockchain status:', error);
      throw new Error(`Failed to update blockchain status: ${error.message}`);
    }

    return data;
  }
};

