import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/taskService';
import toast from 'react-hot-toast';

export const useTasks = (params) => {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => taskService.getTasks(params),
    staleTime: 30 * 1000,
    select: (data) => ({
      tasks: data.data || [],
      pagination: data.pagination,
    }),
  });
};

export const useTask = (id) => {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => taskService.getTask(id),
    enabled: !!id,
  });
};

export const useTaskStats = () => {
  return useQuery({
    queryKey: ['tasks', 'stats'],
    queryFn: taskService.getStats,
    staleTime: 60 * 1000,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: taskService.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create task');
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => taskService.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update task');
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: taskService.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    },
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => taskService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Status updated!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    },
  });
};
