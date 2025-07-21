import Header from "@/components/Header";
import TodoCalendar from "@/components/TodoCalendar";
import Footer from "@/components/Footer";

const TodoDemo = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        <TodoCalendar />
      </main>
      <Footer />
    </div>
  );
};

export default TodoDemo;