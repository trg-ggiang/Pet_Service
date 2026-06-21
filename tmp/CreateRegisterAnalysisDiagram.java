import java.awt.geom.Point2D;

import com.change_vision.jude.api.inf.AstahAPI;
import com.change_vision.jude.api.inf.editor.BasicModelEditor;
import com.change_vision.jude.api.inf.editor.ClassDiagramEditor;
import com.change_vision.jude.api.inf.editor.ModelEditorFactory;
import com.change_vision.jude.api.inf.editor.TransactionManager;
import com.change_vision.jude.api.inf.model.IAssociation;
import com.change_vision.jude.api.inf.model.IAttribute;
import com.change_vision.jude.api.inf.model.IClass;
import com.change_vision.jude.api.inf.model.IDependency;
import com.change_vision.jude.api.inf.model.IModel;
import com.change_vision.jude.api.inf.model.IOperation;
import com.change_vision.jude.api.inf.model.IPackage;
import com.change_vision.jude.api.inf.presentation.ILinkPresentation;
import com.change_vision.jude.api.inf.presentation.INodePresentation;
import com.change_vision.jude.api.inf.project.ProjectAccessor;


public class CreateRegisterAnalysisDiagram {
    private static final String OUTPUT =
        "D:/Pet_Sevice/output/diagrams/Bieu_do_lop_phan_tich_UC_Dang_ky_tai_khoan_Hoan_chinh.asta";

    private static IAttribute attribute(
        BasicModelEditor editor, IClass owner, String name, String type
    ) throws Exception {
        IAttribute value = editor.createAttribute(owner, name, type);
        value.setVisibility("private");
        return value;
    }

    private static IOperation operation(
        BasicModelEditor editor, IClass owner, String name, String returnType,
        String[][] parameters
    ) throws Exception {
        IOperation value = editor.createOperation(owner, name, returnType);
        value.setVisibility("public");
        for (String[] parameter : parameters) {
            editor.createParameter(value, parameter[0], parameter[1]);
        }
        return value;
    }

    private static void styleNode(
        INodePresentation node, double width, double height, String color
    ) throws Exception {
        node.setWidth(width);
        node.setHeight(height);
        node.setProperty("fill.color", color);
        node.setProperty("font.color", "#000000");
        node.setProperty("notation_type", "normal");
        node.setProperty("auto_resize", "false");
    }

    public static void main(String[] args) {
        ProjectAccessor projectAccessor = null;
        try {
            projectAccessor = AstahAPI.getAstahAPI().getProjectAccessor();
            projectAccessor.create(OUTPUT);
            IModel project = projectAccessor.getProject();

            TransactionManager.beginTransaction();
            BasicModelEditor modelEditor = ModelEditorFactory.getBasicModelEditor();
            IPackage registerPackage = modelEditor.createPackage(
                project, "UC Đăng ký tài khoản"
            );

            IClass registerScreen = modelEditor.createClass(registerPackage, "RegisterScreen");
            registerScreen.addStereotype("boundary");
            registerScreen.setDefinition(
                "Tiếp nhận thông tin đăng ký của chủ nuôi và hiển thị kết quả xử lý."
            );
            attribute(modelEditor, registerScreen, "fullName", "String");
            attribute(modelEditor, registerScreen, "email", "String");
            attribute(modelEditor, registerScreen, "phone", "String");
            attribute(modelEditor, registerScreen, "password", "String");
            attribute(modelEditor, registerScreen, "confirmPassword", "String");
            attribute(modelEditor, registerScreen, "agreedToTerms", "boolean");
            operation(modelEditor, registerScreen, "submitRegistration", "void",
                new String[][] {});
            operation(modelEditor, registerScreen, "showValidationError", "void",
                new String[][] {{"message", "String"}});
            operation(modelEditor, registerScreen, "showRegistrationSuccess", "void",
                new String[][] {});

            IClass registerController = modelEditor.createClass(
                registerPackage, "RegisterController"
            );
            registerController.addStereotype("control");
            registerController.setDefinition(
                "Điều phối luồng đăng ký, kiểm tra dữ liệu đầu vào và chuyển người dùng vào hệ thống."
            );
            operation(modelEditor, registerController, "validateInput", "boolean",
                new String[][] {});
            operation(modelEditor, registerController, "registerCustomer", "AuthSession",
                new String[][] {});
            operation(modelEditor, registerController, "navigateToCustomerPortal", "void",
                new String[][] {});

            IClass user = modelEditor.createClass(registerPackage, "User");
            user.addStereotype("entity");
            user.setDefinition(
                "Tài khoản dùng để xác thực và phân quyền trong hệ thống."
            );
            attribute(modelEditor, user, "id", "int");
            attribute(modelEditor, user, "email", "String");
            attribute(modelEditor, user, "passwordHash", "String");
            attribute(modelEditor, user, "role", "Role");
            attribute(modelEditor, user, "status", "UserStatus");
            attribute(modelEditor, user, "authVersion", "int");

            IClass customer = modelEditor.createClass(registerPackage, "Customer");
            customer.addStereotype("entity");
            customer.setDefinition(
                "Hồ sơ chủ nuôi được tạo sau khi tài khoản đăng ký thành công."
            );
            attribute(modelEditor, customer, "id", "int");
            attribute(modelEditor, customer, "userId", "int");
            attribute(modelEditor, customer, "fullName", "String");
            attribute(modelEditor, customer, "phone", "String");
            attribute(modelEditor, customer, "address", "String");

            IClass authService = modelEditor.createClass(registerPackage, "AuthService");
            authService.addStereotype("control");
            authService.setDefinition(
                "Thực hiện nghiệp vụ xác thực và tạo tài khoản khách hàng."
            );
            operation(modelEditor, authService, "checkEmailExists", "boolean",
                new String[][] {});
            operation(modelEditor, authService, "hashPassword", "String",
                new String[][] {});
            operation(modelEditor, authService, "createUser", "User",
                new String[][] {});
            operation(modelEditor, authService, "createCustomerProfile", "Customer",
                new String[][] {});
            operation(modelEditor, authService, "issueAccessToken", "String",
                new String[][] {});

            IDependency screenToController = modelEditor.createDependency(
                registerController, registerScreen, "gửi thông tin đăng ký"
            );
            IDependency controllerToService = modelEditor.createDependency(
                authService, registerController, "yêu cầu tạo tài khoản"
            );
            IDependency serviceToUser = modelEditor.createDependency(
                user, authService, "tạo tài khoản"
            );
            IDependency serviceToCustomer = modelEditor.createDependency(
                customer, authService, "tạo hồ sơ chủ nuôi"
            );
            IAssociation userCustomer = modelEditor.createAssociation(
                user, customer, "sở hữu hồ sơ", "account", "profile"
            );
            for (IAttribute memberEnd : userCustomer.getMemberEnds()) {
                memberEnd.setMultiplicityString("1");
            }

            ClassDiagramEditor diagramEditor = projectAccessor
                .getDiagramEditorFactory().getClassDiagramEditor();
            diagramEditor.createClassDiagram(
                registerPackage, "Biểu đồ lớp phân tích - UC Đăng ký tài khoản"
            );

            INodePresentation screenNode = diagramEditor.createNodePresentation(
                registerScreen, new Point2D.Double(40, 190)
            );
            INodePresentation controllerNode = diagramEditor.createNodePresentation(
                registerController, new Point2D.Double(450, 220)
            );
            INodePresentation serviceNode = diagramEditor.createNodePresentation(
                authService, new Point2D.Double(840, 185)
            );
            INodePresentation userNode = diagramEditor.createNodePresentation(
                user, new Point2D.Double(1290, 40)
            );
            INodePresentation customerNode = diagramEditor.createNodePresentation(
                customer, new Point2D.Double(1290, 430)
            );

            styleNode(screenNode, 330, 300, "#FFF2CC");
            styleNode(controllerNode, 310, 190, "#DDEBF7");
            styleNode(serviceNode, 340, 255, "#DDEBF7");
            styleNode(userNode, 270, 255, "#E2F0D9");
            styleNode(customerNode, 270, 235, "#E2F0D9");

            ILinkPresentation link1 = diagramEditor.createLinkPresentation(
                screenToController, screenNode, controllerNode
            );
            ILinkPresentation link2 = diagramEditor.createLinkPresentation(
                controllerToService, controllerNode, serviceNode
            );
            ILinkPresentation link3 = diagramEditor.createLinkPresentation(
                serviceToUser, serviceNode, userNode
            );
            ILinkPresentation link4 = diagramEditor.createLinkPresentation(
                serviceToCustomer, serviceNode, customerNode
            );
            ILinkPresentation link5 = diagramEditor.createLinkPresentation(
                userCustomer, userNode, customerNode
            );

            link1.setProperty("line.color", "#000000");
            link2.setProperty("line.color", "#000000");
            link3.setProperty("line.color", "#000000");
            link4.setProperty("line.color", "#000000");
            link5.setProperty("line.color", "#000000");

            TransactionManager.endTransaction();
            projectAccessor.save();
            projectAccessor.close();
            System.out.println(OUTPUT);
        } catch (Throwable error) {
            if (TransactionManager.isInTransaction()) {
                TransactionManager.abortTransaction();
            }
            error.printStackTrace();
            try {
                if (projectAccessor != null) projectAccessor.close();
            } catch (Throwable ignored) {
            }
            System.exit(1);
        }
    }
}
