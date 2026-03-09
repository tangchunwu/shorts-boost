import { useGuest } from '@/contexts/GuestContext';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserPlus } from 'lucide-react';

interface GuestPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

export default function GuestPromptDialog({ open, onOpenChange, featureName = '此功能' }: GuestPromptDialogProps) {
  const { exitGuestMode } = useGuest();
  const navigate = useNavigate();

  const handleRegister = () => {
    onOpenChange(false);
    exitGuestMode();
    navigate('/auth');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="rounded-lg bg-primary/10 p-2">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <AlertDialogTitle>注册后解锁{featureName}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            访客模式下无法使用 AI 分析等高级功能。注册账号后即可享受完整体验，数据也将被永久保存。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>继续浏览</AlertDialogCancel>
          <AlertDialogAction onClick={handleRegister}>
            免费注册
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook that returns a guard function for guest mode.
 * Call `guardGuest()` before performing restricted actions.
 * Returns `true` if the user is a guest (action should be blocked).
 */
export function useGuestGuard() {
  const { isGuest } = useGuest();
  return { isGuest };
}
