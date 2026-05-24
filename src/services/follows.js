import { supabase } from './supabase'

export const followsService = {
  async isFollowing(followerId, followingId) {
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle()
    return !!data
  },

  async follow(followerId, followingId) {
    return supabase.from('follows').insert([{ follower_id: followerId, following_id: followingId }])
  },

  async unfollow(followerId, followingId) {
    return supabase.from('follows').delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
  },

  async getFollowing(followerId) {
    return supabase.from('follows').select('following_id').eq('follower_id', followerId)
  },

  async getProfileStats(userId) {
    return supabase.from('profile_stats').select('*').eq('user_id', userId).single()
  }
}
