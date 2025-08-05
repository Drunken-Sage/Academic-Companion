import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { Settings as SettingsIcon, Moon, Sun, User as UserIcon, BookOpen, Plus, X } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

interface UserCourse {
  id: string;
  course_name: string;
  course_code?: string;
  instructor?: string;
  semester?: string;
}

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  major: string | null;
  weekly_study_goal?: number;
}

const Settings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<UserCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCourse, setNewCourse] = useState({ name: '', code: '', instructor: '', semester: '' });
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useState<number>(40);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      setUser(session.user);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData);
        setWeeklyGoal(profileData.weekly_study_goal || 40);
      }

      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('user_courses')
        .select('*')
        .eq('user_id', session.user.id)
        .order('course_name');

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
      } else {
        setCourses(coursesData || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (field: string, value: string) => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error updating profile",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setProfile({ ...profile, [field]: value });
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateWeeklyGoal = async () => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ weekly_study_goal: weeklyGoal })
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setProfile(prev => prev ? { ...prev, weekly_study_goal: weeklyGoal } : null);
        toast({
          title: "Success",
          description: "Weekly study goal updated successfully"
        });
      }
    } catch (error) {
      console.error('Error updating weekly goal:', error);
      toast({
        title: "Error",
        description: "Failed to update weekly study goal",
        variant: "destructive"
      });
    }
  };

  const addCourse = async () => {
    if (!user || !newCourse.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('user_courses')
        .insert([
          {
            user_id: user.id,
            course_name: newCourse.name.trim(),
            course_code: newCourse.code.trim() || null,
            instructor: newCourse.instructor.trim() || null,
            semester: newCourse.semester.trim() || null,
          }
        ])
        .select()
        .single();

      if (error) {
        toast({
          title: "Error adding course",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setCourses([...courses, data]);
        setNewCourse({ name: '', code: '', instructor: '', semester: '' });
        setIsAddingCourse(false);
        toast({
          title: "Course added",
          description: "Your course has been successfully added.",
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const removeCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('user_courses')
        .delete()
        .eq('id', courseId);

      if (error) {
        toast({
          title: "Error removing course",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setCourses(courses.filter(course => course.id !== courseId));
        toast({
          title: "Course removed",
          description: "Your course has been successfully removed.",
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <SettingsIcon className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and academic details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={profile?.display_name || ''}
                onChange={(e) => updateProfile('display_name', e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="major">Major</Label>
              <Input
                id="major"
                value={profile?.major || ''}
                onChange={(e) => updateProfile('major', e.target.value)}
                placeholder="e.g. Computer Science"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Read-only)</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the appearance of the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes.
                </p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Study Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Study Goals
            </CardTitle>
            <CardDescription>
              Set your weekly study goals and targets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weekly-goal">Weekly Study Goal (hours)</Label>
              <div className="flex gap-2">
                <Input
                  id="weekly-goal"
                  type="number"
                  min="1"
                  max="168"
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                  placeholder="40"
                />
                <Button onClick={updateWeeklyGoal} variant="outline">
                  Save
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Set your target number of study hours per week. This will be used in your analytics dashboard.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Course Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My Courses
            </CardTitle>
            <CardDescription>
              Manage the courses you're currently taking.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Courses */}
            <div className="space-y-3">
              {courses.length > 0 ? (
                <div className="grid gap-2">
                  {courses.map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{course.course_code || 'N/A'}</Badge>
                        <div>
                          <p className="font-medium">{course.course_name}</p>
                          {course.instructor && (
                            <p className="text-sm text-muted-foreground">
                              Instructor: {course.instructor}
                            </p>
                          )}
                          {course.semester && (
                            <p className="text-sm text-muted-foreground">
                              Semester: {course.semester}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCourse(course.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No courses added yet. Add your first course below.
                </p>
              )}
            </div>

            {/* Add New Course */}
            {isAddingCourse ? (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="course-name">Course Name *</Label>
                    <Input
                      id="course-name"
                      value={newCourse.name}
                      onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                      placeholder="e.g. Introduction to Computer Science"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-code">Course Code</Label>
                    <Input
                      id="course-code"
                      value={newCourse.code}
                      onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                      placeholder="e.g. CS101"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructor">Instructor</Label>
                    <Input
                      id="instructor"
                      value={newCourse.instructor}
                      onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                      placeholder="e.g. Dr. Smith"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Input
                      id="semester"
                      value={newCourse.semester}
                      onChange={(e) => setNewCourse({ ...newCourse, semester: e.target.value })}
                      placeholder="e.g. Fall 2024"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={addCourse} disabled={!newCourse.name.trim()}>
                    Add Course
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsAddingCourse(false);
                    setNewCourse({ name: '', code: '', instructor: '', semester: '' });
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setIsAddingCourse(true)} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add New Course
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;