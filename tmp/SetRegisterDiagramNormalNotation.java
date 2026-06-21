import java.awt.geom.Point2D;
import java.util.HashMap;
import java.util.Map;

import com.change_vision.jude.api.inf.AstahAPI;
import com.change_vision.jude.api.inf.editor.ClassDiagramEditor;
import com.change_vision.jude.api.inf.editor.TransactionManager;
import com.change_vision.jude.api.inf.model.IClass;
import com.change_vision.jude.api.inf.model.IDependency;
import com.change_vision.jude.api.inf.model.IDiagram;
import com.change_vision.jude.api.inf.model.INamedElement;
import com.change_vision.jude.api.inf.model.IOperation;
import com.change_vision.jude.api.inf.presentation.ILinkPresentation;
import com.change_vision.jude.api.inf.presentation.INodePresentation;
import com.change_vision.jude.api.inf.presentation.IPresentation;
import com.change_vision.jude.api.inf.project.ProjectAccessor;


public class SetRegisterDiagramNormalNotation {
    public static void main(String[] args) throws Exception {
        ProjectAccessor accessor = AstahAPI.getAstahAPI().getProjectAccessor();
        accessor.open(args[0]);
        TransactionManager.beginTransaction();

        for (INamedElement element : accessor.findElements(IClass.class)) {
            if (!(element instanceof IClass)) continue;
            if (!element.getName().matches("RegisterController|AuthService")) continue;
            for (IOperation operation : ((IClass) element).getOperations()) {
                if (operation.getParameters().length > 0) {
                    operation.removeParameter(operation.getParameters());
                }
            }
        }

        for (INamedElement element : accessor.findElements(IDiagram.class)) {
            IDiagram diagram = (IDiagram) element;
            if (!diagram.getName().contains("UC Đăng ký tài khoản")) continue;

            ClassDiagramEditor editor = accessor.getDiagramEditorFactory()
                .getClassDiagramEditor();
            editor.setDiagram(diagram);
            Map<String, INodePresentation> nodes = new HashMap<>();
            for (IPresentation presentation : diagram.getPresentations()) {
                if (presentation.getModel() != null
                    && "Class".equals(presentation.getType())) {
                    presentation.setProperty("notation_type", "normal");
                    presentation.setProperty("auto_resize", "false");
                    String name = ((INamedElement) presentation.getModel()).getName();
                    nodes.put(name, (INodePresentation) presentation);
                }
            }

            place(nodes.get("RegisterScreen"), 40, 190, 330, 300);
            place(nodes.get("RegisterController"), 450, 220, 310, 190);
            place(nodes.get("AuthService"), 840, 185, 340, 255);
            place(nodes.get("User"), 1290, 40, 270, 255);
            place(nodes.get("Customer"), 1290, 430, 270, 235);

            Map<String, IDependency> dependencies = new HashMap<>();
            for (IPresentation presentation : diagram.getPresentations()) {
                if (presentation instanceof ILinkPresentation
                    && presentation.getModel() instanceof IDependency) {
                    IDependency dependency = (IDependency) presentation.getModel();
                    dependencies.put(dependency.getName(), dependency);
                    editor.deletePresentation(presentation);
                }
            }

            createDependency(editor, dependencies.get("gửi thông tin đăng ký"),
                nodes.get("RegisterController"), nodes.get("RegisterScreen"));
            createDependency(editor, dependencies.get("yêu cầu tạo tài khoản"),
                nodes.get("AuthService"), nodes.get("RegisterController"));
            createDependency(editor, dependencies.get("tạo tài khoản"),
                nodes.get("User"), nodes.get("AuthService"));
            createDependency(editor, dependencies.get("tạo hồ sơ chủ nuôi"),
                nodes.get("Customer"), nodes.get("AuthService"));
        }
        TransactionManager.endTransaction();
        accessor.save();
        accessor.close();
    }

    private static void place(
        INodePresentation node, double x, double y, double width, double height
    ) throws Exception {
        node.setLocation(new Point2D.Double(x, y));
        node.setWidth(width);
        node.setHeight(height);
    }

    private static void createDependency(
        ClassDiagramEditor editor, IDependency dependency,
        INodePresentation supplier, INodePresentation client
    ) throws Exception {
        ILinkPresentation link = editor.createLinkPresentation(
            dependency, supplier, client
        );
        link.setProperty("line.color", "#000000");
    }
}
