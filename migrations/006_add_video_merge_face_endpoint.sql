ALTER TABLE public.tasks
  DROP CONSTRAINT tasks_endpoint_check,
  ADD CONSTRAINT tasks_endpoint_check
    CHECK (endpoint IN ('merge_face', 'face_swap', 'motion_control', 'video_merge_face'));
